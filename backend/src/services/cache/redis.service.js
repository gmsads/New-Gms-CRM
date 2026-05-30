let Redis;
let redisClient = null;

try {
  Redis = require('ioredis');
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL);
  } else {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: process.env.REDIS_PORT || 6379,
    });
  }

  redisClient.on('connect', () => {
    console.log('✅ Redis Connected (Cache Service)');
  });

  redisClient.on('error', (err) => {
    console.error('❌ Redis Cache Connection Error:', err.message);
  });
} catch (err) {
  console.warn('⚠️ [CacheService] ioredis not installed. Falling back to in-memory mock.');
  redisClient = {
    get: async () => null,
    set: async () => {},
    del: async () => {},
    keys: async () => [],
    on: () => {}
  };
}

const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    if (data) return JSON.parse(data);
    return null;
  } catch (error) {
    console.error('Redis Get Error:', error.message);
    return null;
  }
};

const setCache = async (key, value, ttlSeconds = 3600) => {
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    console.error('Redis Set Error:', error.message);
  }
};

const deleteCache = async (key) => {
  try {
    await redisClient.del(key);
  } catch (error) {
    console.error('Redis Delete Error:', error.message);
  }
};

const clearCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
  } catch (error) {
    console.error('Redis clearCachePattern Error:', error.message);
  }
};

module.exports = {
  redisClient,
  getCache,
  setCache,
  deleteCache,
  clearCachePattern
};
