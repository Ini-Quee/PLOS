/**
 * validateEnv — run before anything else in start().
 * Crashes hard on missing required vars.
 * Warns and disables features for optional vars.
 * Returns a featureFlags object consumed by route handlers.
 */
function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(k => !process.env[k]);

  if (missing.length > 0) {
    console.error('[Startup] FATAL — missing required env vars:', missing.join(', '));
    console.error('[Startup] Copy backend/.env.example to backend/.env and fill in values.');
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
  };

  const disabled = Object.entries(featureFlags)
    .filter(([, v]) => !v)
    .map(([k]) => k.replace('Enabled', ''));

  if (disabled.length > 0) {
    console.warn('[Startup] Features disabled (missing env vars):', disabled.join(', '));
  }

  console.log('[Startup] Env validated. Features enabled:',
    Object.entries(featureFlags).filter(([, v]) => v).map(([k]) => k.replace('Enabled', '')).join(', ') || 'none'
  );

  return featureFlags;
}

module.exports = { validateEnv };
