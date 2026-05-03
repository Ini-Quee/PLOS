/**
 * gmail.js — Send emails via Gmail API using user's OAuth token
 *
 * Requires: googleapis npm package + user connected via /api/oauth/google
 *
 * Endpoints:
 *   POST /api/gmail/send              → send immediately
 *   POST /api/gmail/schedule          → schedule to send later (stores as content_item)
 *   GET  /api/gmail/drafts            → list pending scheduled emails
 */

const express  = require('express');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();
router.use(authenticate);

async function getGmailClient(userId) {
  let googleLib;
  try { googleLib = require('googleapis'); } catch {
    throw new Error('googleapis package not installed. Run: npm install googleapis');
  }

  const { google } = googleLib;

  const tokenRow = await pool.query(
    `SELECT access_token, refresh_token, expires_at FROM user_oauth_tokens
     WHERE user_id=$1 AND provider='google'`,
    [userId]
  );

  if (!tokenRow.rows.length) {
    throw new Error('Google account not connected. Visit Settings → Connect Google to enable Gmail.');
  }

  const { access_token, refresh_token, expires_at } = tokenRow.rows[0];

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2.setCredentials({ access_token, refresh_token, expiry_date: expires_at ? new Date(expires_at).getTime() : undefined });

  // Auto-refresh token if expired
  oauth2.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await pool.query(
        `UPDATE user_oauth_tokens SET access_token=$1, expires_at=$2, updated_at=NOW()
         WHERE user_id=$3 AND provider='google'`,
        [tokens.access_token, tokens.expiry_date ? new Date(tokens.expiry_date) : null, userId]
      ).catch(() => {});
    }
  });

  return google.gmail({ version: 'v1', auth: oauth2 });
}

function buildMimeMessage({ to, subject, body, from }) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n');

  return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// POST /api/gmail/send
router.post('/send', async (req, res) => {
  const { to, subject, body } = req.body;
  if (!to || !body) return res.status(400).json({ error: 'to and body are required' });

  try {
    const gmail = await getGmailClient(req.user.id);

    // Get sender email
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const from = profile.data.emailAddress;

    const raw = buildMimeMessage({ to, subject: subject || '(no subject)', body, from });
    const sent = await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });

    // Log the send
    await pool.query(
      `INSERT INTO scheduled_posts
         (user_id, platform, content, title, scheduled_for, status, source)
       VALUES ($1,'email',$2,$3,NOW(),'posted','lumi')`,
      [req.user.id, body.slice(0, 500), subject || '(email)']
    ).catch(() => {});

    res.json({
      success: true,
      messageId: sent.data.id,
      message: `Email sent to ${to} ✓`,
    });
  } catch (err) {
    console.error('[Gmail] send error:', err.message);
    if (err.message.includes('not connected') || err.message.includes('not installed')) {
      return res.status(503).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
});

// POST /api/gmail/schedule — schedule email to send at a future date
router.post('/schedule', async (req, res) => {
  const { to, subject, body, send_at } = req.body;
  if (!to || !body || !send_at) return res.status(400).json({ error: 'to, body, and send_at are required' });

  try {
    const r = await pool.query(
      `INSERT INTO scheduled_posts
         (user_id, platform, content, title, scheduled_for, source)
       VALUES ($1,'email',$2,$3,$4,'lumi')
       RETURNING id, scheduled_for`,
      [req.user.id, `To: ${to}\n\n${body}`, subject || '(email)', send_at]
    );

    res.json({
      success: true,
      post: r.rows[0],
      message: `Email to ${to} scheduled for ${new Date(send_at).toLocaleDateString()} ✓`,
    });
  } catch (err) {
    console.error('[Gmail] schedule error:', err.message);
    res.status(500).json({ error: 'Failed to schedule email' });
  }
});

// GET /api/gmail/drafts — list scheduled (unsent) emails
router.get('/drafts', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, content, title, scheduled_for, status
       FROM scheduled_posts
       WHERE user_id=$1 AND platform='email' AND status='scheduled'
       ORDER BY scheduled_for ASC`,
      [req.user.id]
    );
    res.json({ drafts: r.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load email drafts' });
  }
});

module.exports = router;
