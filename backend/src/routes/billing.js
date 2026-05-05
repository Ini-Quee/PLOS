/**
 * billing.js — Stripe freemium subscription
 *
 * POST /api/billing/checkout  — create Stripe Checkout Session → return URL
 * POST /api/billing/webhook   — handle Stripe events (no auth — verified by signature)
 * POST /api/billing/portal    — create Stripe Customer Portal session → return URL
 * GET  /api/billing/status    — return user's current subscription_tier
 */
const express  = require('express');
const { pool } = require('../db/connection');
const { authenticate } = require('../middleware/authenticate');

const router = express.Router();

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// ── POST /api/billing/checkout ────────────────────────────────────────────────
router.post('/checkout', authenticate, async (req, res) => {
  const stripe = getStripe();
  if (!stripe || !process.env.STRIPE_PRO_PRICE_ID) {
    return res.status(503).json({ error: 'Billing not configured' });
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    // Get or create Stripe customer
    let { rows } = await pool.query(
      'SELECT stripe_customer_id FROM stripe_customers WHERE user_id = $1',
      [req.user.id]
    );

    let customerId = rows[0]?.stripe_customer_id;
    if (!customerId) {
      const userRow = await pool.query('SELECT email, name FROM users WHERE id = $1', [req.user.id]);
      const customer = await stripe.customers.create({
        email: userRow.rows[0]?.email,
        name:  userRow.rows[0]?.name,
        metadata: { plos_user_id: req.user.id },
      });
      customerId = customer.id;
      await pool.query(
        'INSERT INTO stripe_customers (user_id, stripe_customer_id) VALUES ($1, $2)',
        [req.user.id, customerId]
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_PRO_PRICE_ID, quantity: 1 }],
      success_url: `${frontendUrl}/settings?upgraded=true`,
      cancel_url:  `${frontendUrl}/upgrade`,
      metadata: { plos_user_id: req.user.id },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[Billing] checkout error:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ── POST /api/billing/webhook ─────────────────────────────────────────────────
// Mounted with express.raw() body parser — must come before express.json()
router.post('/webhook', async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Billing not configured' });

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook signature invalid: ${err.message}` });
  }

  // Idempotency — skip if already processed
  try {
    const { rowCount } = await pool.query(
      'INSERT INTO stripe_events (id, type) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      [event.id, event.type]
    );
    if (rowCount === 0) return res.json({ received: true }); // already handled
  } catch { /* continue even if idempotency check fails */ }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId  = session.metadata?.plos_user_id;
      if (userId) {
        // Retrieve subscription to get current_period_end
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const expiresAt = new Date(subscription.current_period_end * 1000);
        await pool.query(
          `UPDATE users SET subscription_tier = 'pro', subscription_expires_at = $2 WHERE id = $1`,
          [userId, expiresAt]
        );
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub     = event.data.object;
      const custRow = await pool.query(
        'SELECT user_id FROM stripe_customers WHERE stripe_customer_id = $1',
        [sub.customer]
      );
      const userId = custRow.rows[0]?.user_id;
      if (userId) {
        await pool.query(
          `UPDATE users SET subscription_tier = 'free', subscription_expires_at = NULL WHERE id = $1`,
          [userId]
        );
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const custRow = await pool.query(
        'SELECT user_id FROM stripe_customers WHERE stripe_customer_id = $1',
        [invoice.customer]
      );
      const userId = custRow.rows[0]?.user_id;
      if (userId && invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
        const expiresAt = new Date(subscription.current_period_end * 1000);
        await pool.query(
          `UPDATE users SET subscription_expires_at = $2 WHERE id = $1`,
          [userId, expiresAt]
        );
      }
    }
  } catch (err) {
    console.error('[Billing] webhook handler error:', err.message);
  }

  res.json({ received: true });
});

// ── POST /api/billing/portal ──────────────────────────────────────────────────
router.post('/portal', authenticate, async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Billing not configured' });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  try {
    const { rows } = await pool.query(
      'SELECT stripe_customer_id FROM stripe_customers WHERE user_id = $1',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'No billing account found' });
    }
    const session = await stripe.billingPortal.sessions.create({
      customer:   rows[0].stripe_customer_id,
      return_url: `${frontendUrl}/settings`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[Billing] portal error:', err.message);
    res.status(500).json({ error: 'Failed to open billing portal' });
  }
});

// ── GET /api/billing/status ───────────────────────────────────────────────────
router.get('/status', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT subscription_tier, subscription_expires_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0] || { subscription_tier: 'free' });
  } catch {
    res.status(500).json({ error: 'Failed to fetch billing status' });
  }
});

module.exports = router;
