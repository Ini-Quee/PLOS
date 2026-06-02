/**
 * validateEnv — run before anything else in start().
 * Crashes hard on missing required vars.
 * Warns and disables features for optional vars.
 * Returns a featureFlags object consumed by route handlers.
 */
const logger = require('./logger');

function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_ACCESS_EXPIRY', 'TOKEN_ENC_KEY'];
  const missing = required.filter(k => !process.env[k]);

  if (missing.length > 0) {
    logger.error({ missing }, 'FATAL — missing required env vars');
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    logger.error({}, 'FATAL — JWT_SECRET must be at least 32 characters');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    logger.error({}, 'FATAL — FRONTEND_URL must be set in production');
    process.exit(1);
  }

  const featureFlags = {
    redisEnabled:  !!process.env.REDIS_URL,
    lumiEnabled:   !!(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY),
    emailEnabled:  !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    pushEnabled:   !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    oauthEnabled:  !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    voiceEnabled:  !!process.env.OPENAI_API_KEY,
    stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
    lumiAppAgentEnabled: process.env.LUMI_APP_AGENT_ENABLED === 'true',
  };

  const disabled = Object.entries(featureFlags)
    .filter(([, v]) => !v)
    .map(([k]) => k.replace('Enabled', ''));

  if (disabled.length > 0) {
    logger.warn({ disabled }, 'features disabled (missing env vars)');
  }

  logger.info({ enabled: Object.entries(featureFlags).filter(([, v]) => v).map(([k]) => k.replace('Enabled', '')) }, 'env validated');

  return featureFlags;
}

module.exports = { validateEnv };
