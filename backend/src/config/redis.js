let redis = null;

if (process.env.REDIS_URL) {
  const { default: Redis } = require('ioredis');
  redis = new Redis(process.env.REDIS_URL, { lazyConnect: true });

  redis.on('error', (err) => {
    console.warn('⚠️  Redis error (non-fatal):', err.message);
  });

  redis.connect().catch(() => {
    console.warn('⚠️  Redis unavailable — running without cache.');
    redis = null;
  });
} else {
  console.log('ℹ️  No REDIS_URL set — skipping Redis cache.');
}

// Safe wrappers
const get = async (key) => {
  if (!redis) return null;
  try { return await redis.get(key); } catch { return null; }
};

const set = async (key, value, ttlSeconds = 300) => {
  if (!redis) return;
  try { await redis.set(key, value, 'EX', ttlSeconds); } catch { /* no-op */ }
};

const del = async (key) => {
  if (!redis) return;
  try { await redis.del(key); } catch { /* no-op */ }
};

module.exports = { get, set, del };
