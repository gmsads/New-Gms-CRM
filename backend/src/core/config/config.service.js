const cacheFactory = require('../../services/cache/cacheFactory');
const EnterpriseConfig = require('./enterpriseConfig.model');

class ConfigService {
  constructor() {
    this.memoryCache = new Map();
  }

  /**
   * Retrieves a configuration value following the resilient fallback chain:
   * Memory -> Redis -> MongoDB -> .env -> Defaults
   */
  async get(key, defaultValue = null) {
    // 1. Memory Cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // 2. Redis Cache
    let redisValue = null;
    try {
      redisValue = await cacheFactory.getCache(`config:${key}`);
      if (redisValue !== null && redisValue !== undefined) {
        this.memoryCache.set(key, redisValue);
        return redisValue;
      }
    } catch (err) {
      console.warn(`[ConfigService] Redis lookup failed for key: ${key}`);
    }

    // 3. MongoDB
    try {
      // Ensure mongoose connection is ready before querying
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        const dbConfig = await EnterpriseConfig.findOne({ key }).lean();
        if (dbConfig) {
          const value = dbConfig.value;
          this.memoryCache.set(key, value);
          try {
            await cacheFactory.setCache(`config:${key}`, value, 300); // 5 min TTL
          } catch (e) {}
          return value;
        }
      }
    } catch (err) {
      console.warn(`[ConfigService] DB lookup failed for key: ${key}`);
    }

    // 4. .env fallback
    if (process.env[key] !== undefined) {
      let envVal = process.env[key];
      if (envVal === 'true') envVal = true;
      if (envVal === 'false') envVal = false;
      this.memoryCache.set(key, envVal);
      return envVal;
    }

    // 5. Defaults
    return defaultValue;
  }

  clearMemoryCache(key) {
    if (key) {
      this.memoryCache.delete(key);
    } else {
      this.memoryCache.clear();
    }
  }
}

module.exports = new ConfigService();
