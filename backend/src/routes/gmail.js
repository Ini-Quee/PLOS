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
const { z }    = require('zod');
const { pool } = require('../db/connection');
const logger = require('../lib/logger');
const { authenticate } = require('../middleware/authenticate');
const { validateInput } = require('../middleware/validateInput');

const sendSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().max(500).optional(),
  body: z.string().min(1, 'Email body is required').max(10000),
});

const scheduleSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().max(500).optional(),
  body: z.string().min(1, 'Email body is required').max(10000),
  send_at: z.string().datetime('Invalid datetime'),
});

const extractSchema = z.object({
  context: z.string().min(10, 'Context must be at least 10 characters').max(5000),
});
const { decrypt, encrypt } = require('../crypto/tokenCipher');

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

  const { access_token: _at, refresh_token: _rt, expires_at } = tokenRow.rows[0];
  const access_token = decrypt(_at);
  const refresh_token = decrypt(_rt);

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
        [encrypt(tokens.access_token), tokens.expiry_date ? new Date(tokens.expiry_date) : null, userId]
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
router.post('/send', validateInput(sendSchema), async (req, res) => {
  const { to, subject, body } = req.body;

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
    logger.error({ action: 'gmail_send', err: err.message }, 'send failed');
    if (err.message.includes('not connected') || err.message.includes('not installed')) {
      return res.status(503).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to send email', detail: err.message });
  }
});

// POST /api/gmail/schedule — schedule email to send at a future date
router.post('/schedule', validateInput(scheduleSchema), async (req, res) => {
  const { to, subject, body, send_at } = req.body;

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
    logger.error({ action: 'gmail_schedule', err: err.message }, 'schedule failed');
    res.status(500).json({ error: 'Failed to schedule email' });
  }
});

// POST /api/gmail/extract — extract email fields from pasted context using Groq
router.post('/extract', validateInput(extractSchema), async (req, res) => {
  const { context } = req.body;

  let Groq;
  try { Groq = require('groq-sdk'); } catch {
    return res.status(503).json({ error: 'Groq SDK not available' });
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `You are an email extraction assistant. Given client notes or context, extract email sending details.

Context:
${context.slice(0, 2000)}

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "to": "<email address found in context, or empty string if none>",
  "name": "<recipient first name>",
  "subject": "<concise email subject line>",
  "body": "<professional email body, 3-5 sentences, signed off naturally>",
  "cta": "<the main call to action in one sentence>"
}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 600,
    });

    const raw = completion.choices[0]?.message?.content?.trim() || '{}';
    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    res.json({
      to: parsed.to || '',
      name: parsed.name || '',
      subject: parsed.subject || '',
      body: parsed.body || '',
      cta: parsed.cta || '',
    });
  } catch (err) {
    logger.error({ action: 'gmail_extract', err: err.message }, 'extract failed');
    res.status(500).json({ error: 'Extraction failed', detail: err.message });
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
