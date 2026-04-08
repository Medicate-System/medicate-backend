const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379, // changed default to 6379
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on('error', (err) => logger.error('❌ Redis error:', err));
    redisClient.on('connect', () => logger.info('✅ Redis connected successfully'));

    await redisClient.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error.message);
    // don't throw — continue without Redis (features degrade)
  }
};

const getRedis = () => {
  if (!redisClient) throw new Error('Redis client not initialized');
  return redisClient;
};

// ─── Cache Helpers ────────────────────────────────────────
const cacheSet = async (key, value, ttlSeconds = 3600) => {
  await getRedis().setEx(key, ttlSeconds, JSON.stringify(value));
};

const cacheGet = async (key) => {
  const data = await getRedis().get(key);
  return data ? JSON.parse(data) : null;
};

const cacheDel = async (key) => {
  await getRedis().del(key);
};

module.exports = { connectRedis, getRedis, cacheSet, cacheGet, cacheDel };