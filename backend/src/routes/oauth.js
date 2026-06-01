/**
 * oauth.js — Google OAuth (Gmail + Drive)
 *
 * Setup required:
 *   npm install googleapis
 *   .env: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
 *
 * Endpoints:
 *   GET  /api/oauth/google           → redirect to Google consent
 *   GET  /api/oauth/google/callback  → exchange code, store tokens
 *   GET  /api/oauth/google/status    → is user connected?
 *   DELETE /api/oauth/google         → revoke + delete tokens
 */

const express  = require('express');
const crypto   = require('crypto');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');
const { encrypt, decrypt } = require('../crypto/tokenCipher');

const router = express.Router();

function getOAuth2Client() {
  try {
    const { google } = require('googleapis');
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/oauth/google/callback'
    );
  } catch {
    return null;
  }
}

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
];

// GET /api/oauth/google — redirect to Google consent screen
router.get('/google', authenticate, async (req, res) => {
  const oauth2 = getOAuth2Client();
  if (!oauth2 || !process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      error: 'Google OAuth not configured',
      setup: 'Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI to .env and run: npm install googleapis',
    });
  }

  // Generate a cryptographically random CSRF state token and store it
  const state = crypto.randomBytes(32).toString('hex');
  await pool.query(
    `INSERT INTO oauth_states (state, user_id) VALUES ($1, $2)`,
    [state, req.user.id]
  );

  // Purge expired state tokens opportunistically
  pool.query(`DELETE FROM oauth_states WHERE expires_at < NOW()`).catch(() => {});

  const url = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state,
    prompt: 'consent',
  });

  res.redirect(url);
});

// GET /api/oauth/google/callback — exchange code for tokens
router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

  if (error) {
    return res.redirect(`${frontendUrl}/settings?oauth_error=${encodeURIComponent(error)}`);
  }

  // Validate CSRF state token
  if (!state) {
    return res.redirect(`${frontendUrl}/settings?oauth_error=missing_state`);
  }

  let userId;
  try {
    const stateRow = await pool.query(
      `DELETE FROM oauth_states WHERE state = $1 AND expires_at > NOW() RETURNING user_id`,
      [state]
    );
    if (stateRow.rows.length === 0) {
      return res.redirect(`${frontendUrl}/settings?oauth_error=invalid_state`);
    }
    userId = stateRow.rows[0].user_id;
  } catch (err) {
    return res.redirect(`${frontendUrl}/settings?oauth_error=state_check_failed`);
  }

  const oauth2 = getOAuth2Client();
  if (!oauth2) {
    return res.redirect(`${frontendUrl}/settings?oauth_error=not_configured`);
  }

  try {
    const { tokens } = await oauth2.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    await pool.query(
      `INSERT INTO user_oauth_tokens
         (user_id, provider, access_token, refresh_token, expires_at, scopes)
       VALUES ($1,'google',$2,$3,$4,$5)
       ON CONFLICT (user_id, provider) DO UPDATE SET
         access_token  = EXCLUDED.access_token,
         refresh_token = COALESCE(EXCLUDED.refresh_token, user_oauth_tokens.refresh_token),
         expires_at    = EXCLUDED.expires_at,
         updated_at    = NOW()`,
      [userId, encrypt(access_token), encrypt(refresh_token || null),
       expiry_date ? new Date(expiry_date) : null, SCOPES]
    );

    res.redirect(`${frontendUrl}/settings?oauth_success=google`);
  } catch (err) {
    res.redirect(`${frontendUrl}/settings?oauth_error=${encodeURIComponent(err.message)}`);
  }
});

// GET /api/oauth/google/status — check if user has Google connected
router.get('/google/status', authenticate, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, scopes, expires_at, updated_at FROM user_oauth_tokens
       WHERE user_id=$1 AND provider='google'`,
      [req.user.id]
    );
    if (r.rows.length === 0) {
      return res.json({ connected: false });
    }
    const token = r.rows[0];
    const expired = token.expires_at && new Date(token.expires_at) < new Date();
    res.json({
      connected: true,
      scopes: token.scopes || [],
      connectedAt: token.updated_at,
      needsReauth: expired,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check OAuth status' });
  }
});

// DELETE /api/oauth/google — revoke + delete
router.delete('/google', authenticate, async (req, res) => {
  try {
    const r = await pool.query(
      `DELETE FROM user_oauth_tokens WHERE user_id=$1 AND provider='google' RETURNING access_token`,
      [req.user.id]
    );
    if (r.rows.length > 0) {
      const oauth2 = getOAuth2Client();
      if (oauth2) {
        oauth2.revokeToken(decrypt(r.rows[0].access_token)).catch(() => {});
      }
    }
    res.json({ success: true, message: 'Google account disconnected.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to disconnect' });
  }
});

module.exports = router;
