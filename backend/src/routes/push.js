/**
 * push.js — Web Push notification endpoints
 *
 * POST /api/push/subscribe     — save a browser push subscription
 * DELETE /api/push/subscribe   — remove it (user turns off notifications)
 * GET  /api/push/vapid-key     — return the public VAPID key for the frontend
 *
 * Sending is handled by the cron job in server.js, not here.
 */
const express   = require('express');
const webpush   = require('web-push');
const { authenticate } = require('../middleware/authenticate');
const { pool }  = require('../db/connection');

const router = express.Router();

// Initialise VAPID keys — auto-generate and cache in env if not set
function initVapid() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    const keys = webpush.generateVAPIDKeys();
    process.env.VAPID_PUBLIC_KEY  = keys.publicKey;
    process.env.VAPID_PRIVATE_KEY = keys.privateKey;
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Push] VAPID keys not found in .env — generated ephemeral keys.');
      console.warn('[Push] Add these to .env for stable push notifications:');
      console.warn(`  VAPID_PUBLIC_KEY=${keys.publicKey}`);
      console.warn(`  VAPID_PRIVATE_KEY=${keys.privateKey}`);
    }
  }
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || 'admin@plos.app'}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

initVapid();

// GET /api/push/vapid-key — frontend needs this to subscribe
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe — save subscription for this user
router.post('/subscribe', authenticate, async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'endpoint, keys.p256dh and keys.auth are required' });
  }
  try {
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
      [req.user.id, endpoint, keys.p256dh, keys.auth]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[Push] subscribe error:', err.message);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// DELETE /api/push/subscribe — remove subscription
router.delete('/subscribe', authenticate, async (req, res) => {
  const { endpoint } = req.body;
  try {
    await pool.query(
      `DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2`,
      [req.user.id, endpoint]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

/**
 * sendPushToUser(userId, payload)
 * Exported for use by the cron job.
 * payload: { title, body, icon, tag, url }
 */
async function sendPushToUser(userId, payload) {
  const { rows } = await pool.query(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
    [userId]
  );
  for (const sub of rows) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err) {
      // 410 Gone = subscription expired, remove it
      if (err.statusCode === 410) {
        await pool.query(
          `DELETE FROM push_subscriptions WHERE endpoint = $1`, [sub.endpoint]
        ).catch(() => {});
      }
    }
  }
}

module.exports = { router, sendPushToUser };
