const redis = require('redis');

let redisClient;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
    });
    redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });
    await redisClient.connect();
  }
  return redisClient;
}

function rateLimiter(maxAttempts, windowSeconds, keyPrefix) {
  if (!keyPrefix) {
    keyPrefix = 'rl';
  }

  return async (req, res, next) => {
    try {
      const client = await getRedisClient();
      const identifier = req.ip;
      const key = keyPrefix + ':' + identifier;

      const current = await client.incr(key);

      if (current === 1) {
        await client.expire(key, windowSeconds);
      }

      const ttl = await client.ttl(key);

      res.set({
        'X-RateLimit-Limit': maxAttempts.toString(),
        'X-RateLimit-Remaining': Math.max(
          0,
          maxAttempts - current
        ).toString(),
        'X-RateLimit-Reset': ttl.toString(),
      });

      if (current > maxAttempts) {
        return res.status(429).json({
          error: 'Too many requests. Please try again later.',
          retryAfter: ttl,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next();
    }
  };
}

module.exports = { rateLimiter, getRedisClient };