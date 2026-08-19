const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const registryService = require('../services/communicationRegistry.service');
const CommunicationRegistry = require('../models/communicationRegistry.model');

let mongoServer;

describe('Enterprise Communication Registry - Performance & Scalability', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await CommunicationRegistry.deleteMany({});
    registryService.memoryCache.clear();
  });

  describe('Large Dataset Simulation (10,000+ Rules)', () => {
    it('should rapidly lookup a rule amongst 10,000 active rules', async () => {
      // We will bulk insert 10,000 rules to simulate enterprise multi-tenant scale
      const rules = [];
      for (let i = 0; i < 10000; i++) {
        rules.push({
          eventName: `EVENT_${i}`,
          version: 1,
          channels: ['WHATSAPP'],
          isActive: true
        });
      }
      // Insert specific target
      rules.push({
        eventName: 'TARGET_EVENT',
        version: 1,
        channels: ['EMAIL', 'SMS'],
        isActive: true
      });

      await CommunicationRegistry.insertMany(rules);
      
      // Measure Cache Warm-up
      const warmUpStart = Date.now();
      await registryService.cacheRules();
      const warmUpEnd = Date.now();
      
      const warmUpLatency = warmUpEnd - warmUpStart;
      console.log(`[Performance] Cache warm-up for 10,001 rules took ${warmUpLatency}ms`);
      
      // Warm up must be efficient
      expect(registryService.memoryCache.size).toBe(10001);

      // Measure Lookup Latency (From memory cache)
      const lookupStart = Date.now();
      const rule = await registryService.getRule('TARGET_EVENT');
      const lookupEnd = Date.now();

      const lookupLatency = lookupEnd - lookupStart;
      console.log(`[Performance] In-memory lookup latency: ${lookupLatency}ms`);
      
      expect(lookupLatency).toBeLessThan(5); // Sub-5ms lookup guarantee
      expect(rule).toBeDefined();
      expect(rule.channels).toContain('EMAIL');
    });

    it('should maintain memory footprint stability', async () => {
      // Memory should not infinitely grow or leak
      const initialSize = process.memoryUsage().heapUsed;
      
      for(let i=0; i<1000; i++) {
        await registryService.getRule('TARGET_EVENT');
      }
      
      const finalSize = process.memoryUsage().heapUsed;
      const diffMB = (finalSize - initialSize) / 1024 / 1024;
      
      // 1000 fast lookups should not leak significant megabytes of memory
      expect(diffMB).toBeLessThan(5);
    });
  });
});
