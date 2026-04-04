const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { TOTP, Secret } = require('otpauth');
const QRCode = require('qrcode');
const { z } = require('zod');
const { pool } = require('../db/connection');
const { validateInput } = require('../middleware/validateInput');
const { rateLimiter } = require('../middleware/rateLimiter');
const { auditLog } = require('../middleware/auditLog');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().length(6).optional(),
});

const verifyMfaSchema = z.object({
  code: z.string().length(6, 'MFA code must be 6 digits'),
});

router.post(
  '/register',
  rateLimiter(5, 900, 'register'),
  auditLog('register', 'auth'),
  validateInput(registerSchema),
  async (req, res) => {
    try {
      const { email, password, name } = req.body;

      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error:
            'Unable to create account. If this email is already registered, please log in.',
        });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name)
         VALUES ($1, $2, $3)
         RETURNING id, email, name, created_at`,
        [email.toLowerCase(), passwordHash, name]
      );

      const user = result.rows[0];

      res.status(201).json({
        message: 'Account created successfully. Please set up MFA.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'An error occurred during registration',
      });
    }
  }
);

router.post(
  '/login',
  rateLimiter(5, 900, 'login'),
  auditLog('login', 'auth'),
  validateInput(loginSchema),
  async (req, res) => {
    try {
      const { email, password, mfaCode } = req.body;

      const result = await pool.query(
        `SELECT id, email, name, password_hash, mfa_secret,
                mfa_enabled, failed_login_attempts, locked_until
         FROM users WHERE email = $1`,
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        await bcrypt.hash(password, 12);
        return res.status(401).json({
          error: 'Invalid email or password',
        });
      }

      const user = result.rows[0];

      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return res.status(423).json({
          error: 'Account is temporarily locked. Please try again later.',
        });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        const newAttempts = user.failed_login_attempts + 1;
        const lockUntil =
          newAttempts >= 10 ? new Date(Date.now() + 30 * 60 * 1000) : null;

        await pool.query(
          `UPDATE users
           SET failed_login_attempts = $1, locked_until = $2
           WHERE id = $3`,
          [newAttempts, lockUntil, user.id]
        );

        return res.status(401).json({
          error: 'Invalid email or password',
        });
      }

      if (user.mfa_enabled) {
        if (!mfaCode) {
          return res.status(200).json({
            requiresMfa: true,
            message: 'Please provide your MFA code',
          });
        }

        const totp = new TOTP({
          secret: Secret.fromBase32(user.mfa_secret),
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
        });

        const isValidMfa =
          totp.validate({ token: mfaCode, window: 1 }) !== null;

        if (!isValidMfa) {
          return res.status(401).json({
            error: 'Invalid MFA code',
          });
        }
      }

      await pool.query(
        `UPDATE users
         SET failed_login_attempts = 0, locked_until = NULL
         WHERE id = $1`,
        [user.id]
      );

      const accessToken = jwt.sign(
        { sub: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY }
      );

      const refreshToken = crypto.randomBytes(64).toString('hex');
      const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [
          user.id,
          refreshTokenHash,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ]
      );

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth/refresh',
      });

      res.json({
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          mfaEnabled: user.mfa_enabled,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'An error occurred during login',
      });
    }
  }
);

router.post(
  '/refresh',
  auditLog('token_refresh', 'auth'),
  async (req, res) => {
    try {
      const refreshToken = req.cookies
        ? req.cookies.refreshToken
        : undefined;

      if (!refreshToken) {
        return res.status(401).json({
          error: 'No refresh token provided',
        });
      }

      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const result = await pool.query(
        `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked,
                u.email, u.name
         FROM refresh_tokens rt
         JOIN users u ON u.id = rt.user_id
         WHERE rt.token_hash = $1`,
        [tokenHash]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'Invalid refresh token',
        });
      }

      const storedToken = result.rows[0];

      if (storedToken.revoked) {
        await pool.query(
          'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
          [storedToken.user_id]
        );
        return res.status(401).json({
          error: 'Token has been revoked. Please log in again.',
        });
      }

      if (new Date(storedToken.expires_at) < new Date()) {
        return res.status(401).json({
          error: 'Refresh token expired. Please log in again.',
        });
      }

      await pool.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1',
        [storedToken.id]
      );

      const newAccessToken = jwt.sign(
        {
          sub: storedToken.user_id,
          email: storedToken.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY }
      );

      const newRefreshToken = crypto.randomBytes(64).toString('hex');
      const newRefreshHash = crypto
        .createHash('sha256')
        .update(newRefreshToken)
        .digest('hex');

      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [
          storedToken.user_id,
          newRefreshHash,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ]
      );

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth/refresh',
      });

      res.json({
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({
        error: 'An error occurred during token refresh',
      });
    }
  }
);

router.post(
  '/mfa/setup',
  authenticate,
  auditLog('mfa_setup', 'auth'),
  async (req, res) => {
    try {
      const secret = new Secret({ size: 20 });

      const totp = new TOTP({
        issuer: 'PLOS',
        label: req.user.email,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        secret,
      });

      const uri = totp.toString();

      await pool.query(
        'UPDATE users SET mfa_secret = $1 WHERE id = $2',
        [secret.base32, req.user.id]
      );

      const qrCodeDataUrl = await QRCode.toDataURL(uri);

      res.json({
        secret: secret.base32,
        qrCode: qrCodeDataUrl,
        message:
          'Scan the QR code with your authenticator app, then verify with a code to enable MFA.',
      });
    } catch (error) {
      console.error('MFA setup error:', error);
      res.status(500).json({
        error: 'An error occurred during MFA setup',
      });
    }
  }
);

router.post(
  '/mfa/verify',
  authenticate,
  auditLog('mfa_verify', 'auth'),
  validateInput(verifyMfaSchema),
  async (req, res) => {
    try {
      const { code } = req.body;

      const result = await pool.query(
        'SELECT mfa_secret FROM users WHERE id = $1',
        [req.user.id]
      );

      if (!result.rows[0] || !result.rows[0].mfa_secret) {
        return res.status(400).json({
          error: 'MFA has not been set up. Call /mfa/setup first.',
        });
      }

      const totp = new TOTP({
        secret: Secret.fromBase32(result.rows[0].mfa_secret),
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      });

      const isValid =
        totp.validate({ token: code, window: 1 }) !== null;

      if (!isValid) {
        return res.status(400).json({
          error: 'Invalid MFA code. Please try again.',
        });
      }

      await pool.query(
        'UPDATE users SET mfa_enabled = TRUE WHERE id = $1',
        [req.user.id]
      );

      res.json({
        message: 'MFA enabled successfully',
      });
    } catch (error) {
      console.error('MFA verify error:', error);
      res.status(500).json({
        error: 'An error occurred during MFA verification',
      });
    }
  }
);

router.post(
  '/logout',
  authenticate,
  auditLog('logout', 'auth'),
  async (req, res) => {
    try {
      const refreshToken = req.cookies
        ? req.cookies.refreshToken
        : undefined;

      if (refreshToken) {
        const tokenHash = crypto
          .createHash('sha256')
          .update(refreshToken)
          .digest('hex');

        await pool.query(
          'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1',
          [tokenHash]
        );
      }

      res.clearCookie('refreshToken', {
        path: '/api/auth/refresh',
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        error: 'An error occurred during logout',
      });
    }
  }
);

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, name, mfa_enabled, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'An error occurred',
    });
  }
});

module.exports = router;