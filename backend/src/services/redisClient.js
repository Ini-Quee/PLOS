/**
 * Centralized Redis client with health tracking.
 * All callers use getClient() and check isAvailable before Redis operations.
 * If Redis is down, callers fall back to in-memory or PostgreSQL alternatives.
 */
const redis = require('redis');

let client = null;
let available = false;

async function init() {
  if (!process.env.REDIS_URL) {
    console.warn('[Redis] REDIS_URL not set — Redis disabled, using fallbacks');
    return;
  }

  client = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          console.warn('[Redis] Max reconnect attempts reached — disabling Redis');
          available = false;
          return false; // stop retrying
        }
        return Math.min(retries * 200, 2000);
      },
    },
  });

  client.on('ready', () => {
    available = true;
    console.log('[Redis] Connected');
  });

  client.on('error', () => {
    available = false;
  });

  client.on('end', () => {
    available = false;
  });

  try {
    await client.connect();
  } catch {
    available = false;
    console.warn('[Redis] Initial connection failed — using fallbacks');
  }
}

function getClient() {
  return client;
}

function isAvailable() {
  return available && client !== null;
}

module.exports = { init, getClient, isAvailable };
