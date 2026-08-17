const CommunicationRegistry = require('../models/communicationRegistry.model');
const cacheFactory = require('../../../services/cache/cacheFactory');
const mongoose = require('mongoose');

class CommunicationRegistryService {
  constructor() {
    this.memoryCache = new Map();
  }

  getCacheKey(eventName, tenantId = 'global', branchId = 'global') {
    return `comm_registry:${eventName}:${tenantId}:${branchId}`;
  }

  async refreshCache() {
    this.memoryCache.clear();
    await this.cacheRules();
  }

  async cacheRules() {
    // Only cache active rules globally for quick lookup
    if (mongoose.connection.readyState !== 1) return;
    const activeRules = await CommunicationRegistry.find({ isActive: true }).lean();
    
    for (const rule of activeRules) {
      const tenantId = rule.tenantId ? rule.tenantId.toString() : 'global';
      const branchId = rule.branchId ? rule.branchId.toString() : 'global';
      const cacheKey = this.getCacheKey(rule.eventName, tenantId, branchId);
      
      this.memoryCache.set(cacheKey, rule);
      try {
        await cacheFactory.setCache(cacheKey, rule, 3600); // 1 hour TTL
      } catch (err) {}
    }
  }

  async getRule(eventName, tenantId = null, branchId = null) {
    const tId = tenantId ? tenantId.toString() : 'global';
    const bId = branchId ? branchId.toString() : 'global';
    const cacheKey = this.getCacheKey(eventName, tId, bId);

    // 1. Memory
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }

    // 2. Redis
    try {
      const redisVal = await cacheFactory.getCache(cacheKey);
      if (redisVal) {
        this.memoryCache.set(cacheKey, redisVal);
        return redisVal;
      }
    } catch (err) {}

    // 3. Database
    try {
      const query = { eventName, isActive: true };
      if (tenantId) query.tenantId = tenantId;
      else query.tenantId = null;

      if (branchId) query.branchId = branchId;
      else query.branchId = null;

      if (mongoose.connection.readyState === 1) {
        const rule = await CommunicationRegistry.findOne(query).sort({ version: -1 }).lean();
        if (rule) {
          this.memoryCache.set(cacheKey, rule);
          try {
            await cacheFactory.setCache(cacheKey, rule, 3600);
          } catch (err) {}
          return rule;
        }
      }
    } catch (err) {
      console.error(`[RegistryService] DB Error looking up rule for ${eventName}:`, err.message);
    }
    
    return null;
  }

  async getRules(filter = {}) {
    return await CommunicationRegistry.find(filter).sort({ eventName: 1, version: -1 }).lean();
  }

  async validateRule(payload) {
    const validChannels = ['WHATSAPP', 'EMAIL', 'SMS', 'PUSH', 'SLACK', 'TEAMS'];
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    
    if (!payload.eventName) throw new Error('eventName is required');
    
    if (payload.channels) {
      for (const ch of payload.channels) {
        if (!validChannels.includes(ch.toUpperCase())) {
          throw new Error(`Invalid channel: ${ch}`);
        }
      }
    }

    if (payload.priority && !validPriorities.includes(payload.priority.toUpperCase())) {
      throw new Error(`Invalid priority: ${payload.priority}`);
    }

    // Duplicate check for active rules (same event, tenant, branch)
    if (mongoose.connection.readyState === 1) {
      const existingActive = await CommunicationRegistry.findOne({
        eventName: payload.eventName.toUpperCase(),
        tenantId: payload.tenantId || null,
        branchId: payload.branchId || null,
        isActive: true
      });

      if (existingActive && (!payload._id || existingActive._id.toString() !== payload._id.toString())) {
        throw new Error(`An active rule already exists for event ${payload.eventName} with this tenant/branch combination. Deactivate it or create a new version.`);
      }
    }

    return true;
  }

  async createRule(payload) {
    await this.validateRule(payload);
    
    payload.eventName = payload.eventName.toUpperCase();
    if (payload.channels) payload.channels = payload.channels.map(c => c.toUpperCase());
    if (payload.providerPriority) payload.providerPriority = payload.providerPriority.map(p => p.toUpperCase());

    const newRule = await CommunicationRegistry.create(payload);
    await this.refreshCache();
    return newRule;
  }

  async updateRule(id, payload) {
    const existingRule = await CommunicationRegistry.findById(id);
    if (!existingRule) throw new Error('Rule not found');

    // Create a new version instead of mutating
    const newPayload = {
      ...existingRule.toObject(),
      ...payload,
      _id: undefined, // Let mongo generate new ID
      version: existingRule.version + 1,
      isActive: true,
      createdAt: undefined,
      updatedAt: undefined
    };

    await this.validateRule(newPayload);

    // Deactivate old rule
    existingRule.isActive = false;
    existingRule.effectiveTo = new Date();
    await existingRule.save();

    // Create new rule
    const newRule = await CommunicationRegistry.create(newPayload);
    await this.refreshCache();
    return newRule;
  }

  async deactivateRule(id) {
    const rule = await CommunicationRegistry.findById(id);
    if (!rule) throw new Error('Rule not found');
    
    rule.isActive = false;
    rule.effectiveTo = new Date();
    await rule.save();
    
    await this.refreshCache();
    return rule;
  }

  async activateRule(id) {
    const rule = await CommunicationRegistry.findById(id);
    if (!rule) throw new Error('Rule not found');

    // Must validate first to ensure no conflicts with existing active rules
    const validatePayload = { ...rule.toObject(), isActive: true };
    await this.validateRule(validatePayload);

    rule.isActive = true;
    rule.effectiveTo = null;
    await rule.save();

    await this.refreshCache();
    return rule;
  }
}

module.exports = new CommunicationRegistryService();
