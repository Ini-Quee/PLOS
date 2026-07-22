/**
 * Rate limiter middleware.
 * Primary: Redis (fast, survives restarts).
 * Fallback: in-memory Map (works when Redis is down, resets on process restart).
 */
const redisClient = require('../services/redisClient');

// In-memory fallback store: key → { count, expiresAt }
const memStore = new Map();

// Clean up expired in-memory entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of memStore) {
    if (val.expiresAt <= now) memStore.delete(key);
  }
}, 60_000);

function rateLimiter(maxAttempts, windowSeconds, keyPrefix = 'rl') {
  // Production stays strict. In development we raise the ceiling so testing on a
  // phone (repeated logins, hot reloads) doesn't lock you out — and so an
  // already-overflowed counter immediately falls back under the limit.
  const isProd = process.env.NODE_ENV === 'production';
  const effectiveMax = isProd ? maxAttempts : Math.max(maxAttempts, 1000);

  return async (req, res, next) => {
    const identifier = req.ip;
    const key = `${keyPrefix}:${identifier}`;
    maxAttempts = effectiveMax;

    try {
      if (redisClient.isAvailable()) {
        const rc = redisClient.getClient();
        const current = await rc.incr(key);
        if (current === 1) await rc.expire(key, windowSeconds);
        const ttl = await rc.ttl(key);

        res.set({
          'X-RateLimit-Limit': String(maxAttempts),
          'X-RateLimit-Remaining': String(Math.max(0, maxAttempts - current)),
          'X-RateLimit-Reset': String(ttl),
        });

        if (current > maxAttempts) {
          return res.status(429).json({
            error: 'Too many requests. Please try again later.',
            retryAfter: ttl,
          });
        }
      } else {
        // In-memory fallback
        const now = Date.now();
        const entry = memStore.get(key);

        if (!entry || entry.expiresAt <= now) {
          memStore.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
        } else {
          entry.count += 1;
        }

        const { count, expiresAt } = memStore.get(key);
        const ttl = Math.ceil((expiresAt - now) / 1000);

        res.set({
          'X-RateLimit-Limit': String(maxAttempts),
          'X-RateLimit-Remaining': String(Math.max(0, maxAttempts - count)),
          'X-RateLimit-Reset': String(ttl),
        });

        if (count > maxAttempts) {
          return res.status(429).json({
            error: 'Too many requests. Please try again later.',
            retryAfter: ttl,
          });
        }
      }
    } catch (err) {
      console.error('[RateLimit] error:', err.message);
      // On unexpected error, allow the request through rather than blocking users
    }

    next();
  };
}

/**
 * Clear a rate-limit counter. Call this after a SUCCESSFUL login so a legitimate
 * user who finally types the right password is immediately un-throttled, instead
 * of being stuck behind the failed-attempt counter for the whole window.
 */
async function resetRateLimit(req, keyPrefix = 'rl') {
  const key = `${keyPrefix}:${req.ip}`;
  try {
    if (redisClient.isAvailable()) {
      await redisClient.getClient().del(key);
    }
    memStore.delete(key);
  } catch (err) {
    console.error('[RateLimit] reset error:', err.message);
  }
}

// Keep legacy export for any files that import getRedisClient directly
function getRedisClient() {
  return redisClient.isAvailable() ? redisClient.getClient() : null;
}

module.exports = { rateLimiter, resetRateLimit, getRedisClient };
