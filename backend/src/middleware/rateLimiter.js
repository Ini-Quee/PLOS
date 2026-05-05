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
  return async (req, res, next) => {
    const identifier = req.ip;
    const key = `${keyPrefix}:${identifier}`;

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

// Keep legacy export for any files that import getRedisClient directly
function getRedisClient() {
  return redisClient.isAvailable() ? redisClient.getClient() : null;
}

module.exports = { rateLimiter, getRedisClient };
