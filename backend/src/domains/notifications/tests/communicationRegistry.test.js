const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const CommunicationRegistry = require('../models/communicationRegistry.model');
const registryService = require('../services/communicationRegistry.service');

let mongoServer;

describe('Enterprise Communication Registry', () => {
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

  it('should validate and create a new rule', async () => {
    const payload = {
      eventName: 'TEST_EVENT',
      channels: ['WHATSAPP', 'EMAIL'],
      priority: 'HIGH'
    };
    const rule = await registryService.createRule(payload);
    expect(rule.eventName).toBe('TEST_EVENT');
    expect(rule.channels).toContain('WHATSAPP');
    expect(rule.version).toBe(1);
    expect(rule.isActive).toBe(true);
  });

  it('should prevent duplicate active rules for the same event and tenant', async () => {
    const payload = { eventName: 'TEST_EVENT', channels: ['WHATSAPP'] };
    await registryService.createRule(payload);
    
    await expect(registryService.createRule(payload)).rejects.toThrow(/An active rule already exists/);
  });

  it('should version up when updating a rule', async () => {
    const payload = { eventName: 'VERSION_TEST', channels: ['WHATSAPP'] };
    const originalRule = await registryService.createRule(payload);
    
    const updatedRule = await registryService.updateRule(originalRule._id, { channels: ['EMAIL'] });
    
    expect(updatedRule.version).toBe(2);
    expect(updatedRule.channels).toContain('EMAIL');
    
    // Verify old rule was deactivated
    const oldRule = await CommunicationRegistry.findById(originalRule._id);
    expect(oldRule.isActive).toBe(false);
  });

  it('should deactivate a rule', async () => {
    const payload = { eventName: 'DEACTIVATE_TEST', channels: ['WHATSAPP'] };
    const rule = await registryService.createRule(payload);
    
    await registryService.deactivateRule(rule._id);
    
    const dbRule = await CommunicationRegistry.findById(rule._id);
    expect(dbRule.isActive).toBe(false);
    expect(dbRule.effectiveTo).toBeInstanceOf(Date);
  });

  it('should activate a deactivated rule if no conflicts', async () => {
    const payload = { eventName: 'ACTIVATE_TEST', channels: ['WHATSAPP'] };
    const rule = await registryService.createRule(payload);
    await registryService.deactivateRule(rule._id);
    
    const activatedRule = await registryService.activateRule(rule._id);
    expect(activatedRule.isActive).toBe(true);
    expect(activatedRule.effectiveTo).toBeNull();
  });

  it('should throw error when activating a rule with conflicts', async () => {
    const payload1 = { eventName: 'CONFLICT_TEST', channels: ['WHATSAPP'] };
    const rule1 = await registryService.createRule(payload1);
    await registryService.deactivateRule(rule1._id);
    
    // Create another active rule with same eventName
    await registryService.createRule(payload1);
    
    // Attempting to activate rule1 should throw
    await expect(registryService.activateRule(rule1._id)).rejects.toThrow(/An active rule already exists/);
  });

  it('should cache rules in memory', async () => {
    const payload = { eventName: 'CACHE_TEST', channels: ['WHATSAPP'] };
    await registryService.createRule(payload);
    
    const rule = await registryService.getRule('CACHE_TEST');
    expect(rule).toBeDefined();
    
    const cacheKey = registryService.getCacheKey('CACHE_TEST', 'global', 'global');
    expect(registryService.memoryCache.has(cacheKey)).toBe(true);
  });
});
