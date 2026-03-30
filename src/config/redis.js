const { createClient } = require('redis');
const logger = require('../utils/logger');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6380,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on('error', (err) => logger.error('❌ Redis error:', err));
    redisClient.on('connect', () => logger.info('✅ Redis connected successfully'));

    await redisClient.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error.message);
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