const cacheFactory = require('../../services/cache/cacheFactory');
const EnterpriseSecret = require('./enterpriseSecret.model');

class SecretsService {
  constructor() {
    this.memoryCache = new Map();
  }

  /**
   * Retrieves a secret value following the resilient fallback chain:
   * Memory -> Redis -> MongoDB -> .env -> Defaults
   */
  async getSecret(key, defaultValue = null) {
    // 1. Memory Cache
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }

    // 2. Redis Cache
    let redisValue = null;
    try {
      redisValue = await cacheFactory.getCache(`secret:${key}`);
      if (redisValue !== null && redisValue !== undefined) {
        this.memoryCache.set(key, redisValue);
        return redisValue;
      }
    } catch (err) {
      console.warn(`[SecretsService] Redis lookup failed for secret: ${key}`);
    }

    // 3. MongoDB (or vault in future)
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        const dbSecret = await EnterpriseSecret.findOne({ key }).lean();
        if (dbSecret) {
          // Decrypt dbSecret.value in a real world secure environment
          const value = dbSecret.value; 
          this.memoryCache.set(key, value);
          try {
            await cacheFactory.setCache(`secret:${key}`, value, 300); // 5 min TTL
          } catch (e) {}
          return value;
        }
      }
    } catch (err) {
      console.warn(`[SecretsService] DB lookup failed for secret: ${key}`);
    }

    // 4. .env fallback
    if (process.env[key] !== undefined) {
      const envVal = process.env[key];
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

module.exports = new SecretsService();
