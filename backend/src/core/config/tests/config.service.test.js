const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const configService = require('../config.service');
const EnterpriseConfig = require('../enterpriseConfig.model');
const cacheFactory = require('../../../../services/cache/cacheFactory'); // Assumes mock redis fallback

let mongoServer;

describe('Enterprise Config Service - Hardening & Resiliency', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    // Graceful shutdown validation
    await mongoose.disconnect();
    await mongoServer.stop();
    configService.clearMemoryCache();
  });

  beforeEach(async () => {
    await EnterpriseConfig.deleteMany({});
    configService.clearMemoryCache();
    process.env = {}; // Clear env for isolated tests
  });

  describe('Fallback Chain Resilience', () => {
    it('should return from Memory Cache if available', async () => {
      configService.memoryCache.set('TEST_KEY', 'memory_value');
      const val = await configService.get('TEST_KEY');
      expect(val).toBe('memory_value');
    });

    it('should fallback to DB if Redis is missing, then cache in Memory', async () => {
      await EnterpriseConfig.create({ key: 'DB_KEY', value: 'db_value' });
      const val = await configService.get('DB_KEY');
      expect(val).toBe('db_value');
      expect(configService.memoryCache.get('DB_KEY')).toBe('db_value');
    });

    it('should fallback to .env if DB is empty', async () => {
      process.env.ENV_KEY = 'env_value';
      const val = await configService.get('ENV_KEY');
      expect(val).toBe('env_value');
    });

    it('should fallback to default value if all else fails', async () => {
      const val = await configService.get('MISSING_KEY', 'default_value');
      expect(val).toBe('default_value');
    });
  });

  describe('Concurrency & Load Testing', () => {
    it('should handle 500 concurrent requests without crashing or leaking memory', async () => {
      await EnterpriseConfig.create({ key: 'CONCURRENT_KEY', value: 'concurrent_value' });
      
      const promises = [];
      for (let i = 0; i < 500; i++) {
        promises.push(configService.get('CONCURRENT_KEY'));
      }
      
      const results = await Promise.all(promises);
      expect(results.every(r => r === 'concurrent_value')).toBe(true);
      
      // Memory footprint should be tiny (only 1 key in map)
      expect(configService.memoryCache.size).toBe(1);
    });

    it('should handle cache invalidation during concurrent reads', async () => {
      process.env.STABLE_KEY = 'v1';
      
      const p1 = configService.get('STABLE_KEY');
      configService.clearMemoryCache('STABLE_KEY');
      process.env.STABLE_KEY = 'v2';
      const p2 = configService.get('STABLE_KEY');
      
      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1 === 'v1' || r1 === 'v2').toBe(true);
      expect(r2).toBe('v2');
    });
  });

  describe('Startup & Shutdown Isolation', () => {
    it('should not throw if MongoDB is completely disconnected', async () => {
      // Simulate disconnected state
      const originalReadyState = mongoose.connection.readyState;
      mongoose.connection.readyState = 0; 
      
      process.env.DISCONNECT_KEY = 'fallback';
      const val = await configService.get('DISCONNECT_KEY');
      
      expect(val).toBe('fallback');
      
      // Restore state
      mongoose.connection.readyState = originalReadyState;
    });

    it('should gracefully return default if Redis and Mongo are offline and no .env exists', async () => {
      const originalReadyState = mongoose.connection.readyState;
      mongoose.connection.readyState = 0;
      
      const val = await configService.get('OFFLINE_KEY', 'safe_default');
      expect(val).toBe('safe_default');
      
      mongoose.connection.readyState = originalReadyState;
    });
  });

  describe('Memory Stability', () => {
    it('should not excessively grow the memory cache on unknown keys', async () => {
      // ConfigService currently caches env variables. We must verify it doesn't cache `undefined` 
      // preventing memory leaks from random dynamic lookups.
      for (let i = 0; i < 1000; i++) {
        await configService.get(`RANDOM_${i}`, 'default');
      }
      
      // Only keys found in Redis/DB/.env should be cached to prevent DOS memory bloat
      expect(configService.memoryCache.size).toBe(0);
    });
  });
});
