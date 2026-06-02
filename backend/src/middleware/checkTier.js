/**
 * Tier-gating middleware.
 * Attaches req.user.subscription_tier by querying the DB once per request.
 * Use requirePro to hard-block, or checkLimit(feature) for soft limits.
 */
const { pool } = require('../db/connection');

const FREE_LIMITS = {
  // Temporarily high for Lumi app-agent testing. Can be lowered again for launch.
  lumi_messages_per_day: Number(process.env.LUMI_FREE_MESSAGES_PER_DAY || 10000),
  lumi_pro_messages_per_day: Number(process.env.LUMI_PRO_MESSAGES_PER_DAY || 10000),
  habits_max: 3,
  journal_types: ['personal'],
};

function lumiMessageLimitsDisabled() {
  return process.env.LUMI_DISABLE_MESSAGE_LIMIT === 'true';
}

// Attaches tier to req.user — call this before any tier check
async function attachTier(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT subscription_tier, subscription_expires_at FROM users WHERE id = $1',
      [req.user.id]
    );
    const row = rows[0];
    // Expire pro if subscription_expires_at is in the past
    const tier = row?.subscription_tier === 'pro' &&
      row?.subscription_expires_at &&
      new Date(row.subscription_expires_at) < new Date()
        ? 'free'
        : (row?.subscription_tier || 'free');
    req.user.subscription_tier = tier;
    next();
  } catch {
    req.user.subscription_tier = 'free';
    next();
  }
}

function isPro(req) {
  return req.user.subscription_tier === 'pro';
}

// Hard block — returns 403 with upgrade flag
function requirePro(req, res, next) {
  if (isPro(req)) return next();
  return res.status(403).json({
    error: 'Pro subscription required',
    upgrade: true,
    code: 'UPGRADE_REQUIRED',
  });
}

module.exports = { attachTier, requirePro, isPro, FREE_LIMITS, lumiMessageLimitsDisabled };
