const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const secretsService = require('../secrets.service');
const EnterpriseSecret = require('../enterpriseSecret.model');

let mongoServer;

describe('Enterprise Secrets Service - Hardening & Resiliency', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    secretsService.clearMemoryCache();
  });

  beforeEach(async () => {
    await EnterpriseSecret.deleteMany({});
    secretsService.clearMemoryCache();
    process.env = {};
  });

  describe('Fallback Chain', () => {
    it('should fetch from DB securely', async () => {
      await EnterpriseSecret.create({ key: 'API_TOKEN', value: 'secret123' });
      const val = await secretsService.getSecret('API_TOKEN');
      expect(val).toBe('secret123');
    });

    it('should fallback to .env if DB misses', async () => {
      process.env.ENV_SECRET = 'env_secret_val';
      const val = await secretsService.getSecret('ENV_SECRET');
      expect(val).toBe('env_secret_val');
    });
  });

  describe('Concurrency & Load', () => {
    it('should serve 500 concurrent secret requests efficiently', async () => {
      await EnterpriseSecret.create({ key: 'CONCURRENT_SECRET', value: 'super_secret' });
      
      const promises = [];
      for (let i = 0; i < 500; i++) {
        promises.push(secretsService.getSecret('CONCURRENT_SECRET'));
      }
      
      const results = await Promise.all(promises);
      expect(results.every(r => r === 'super_secret')).toBe(true);
      expect(secretsService.memoryCache.size).toBe(1);
    });
  });

  describe('Offline Tolerance', () => {
    it('should fallback gracefully when Mongo is disconnected', async () => {
      const originalReadyState = mongoose.connection.readyState;
      mongoose.connection.readyState = 0; 
      
      process.env.OFFLINE_SECRET = 'offline_val';
      const val = await secretsService.getSecret('OFFLINE_SECRET');
      
      expect(val).toBe('offline_val');
      
      mongoose.connection.readyState = originalReadyState;
    });
  });
});
