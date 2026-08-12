const executionPlanner = require('../services/executionPlanner.service');
const crypto = require('crypto');

describe('Enterprise Execution Planner V1', () => {
  const validBasePlan = {
    version: 1,
    event: 'ORDER_CREATED',
    channels: [
      { channel: 'WHATSAPP', provider: 'META', priority: 1 }
    ],
    source: 'registry'
  };

  describe('Validation', () => {
    it('should throw MISSING_COMMUNICATION_PLAN when plan is undefined', () => {
      expect(() => executionPlanner.createExecutionPlan({})).toThrow('Communication plan is missing');
      try { executionPlanner.createExecutionPlan({}); } catch (e) { expect(e.code).toBe('MISSING_COMMUNICATION_PLAN'); }
    });

    it('should throw MISSING_COMMUNICATION_PLAN when plan is null', () => {
      expect(() => executionPlanner.createExecutionPlan({ plan: null })).toThrow();
    });

    it('should throw INVALID_COMMUNICATION_PLAN when plan is not an object', () => {
      expect(() => executionPlanner.createExecutionPlan({ plan: 'plan' })).toThrow();
      expect(() => executionPlanner.createExecutionPlan({ plan: [] })).toThrow();
    });

    it('should throw UNSUPPORTED_PLAN_VERSION for invalid version', () => {
      expect(() => executionPlanner.createExecutionPlan({ plan: { ...validBasePlan, version: 2 } })).toThrow();
    });

    it('should throw MISSING_CHANNELS for empty channels', () => {
      expect(() => executionPlanner.createExecutionPlan({ plan: { ...validBasePlan, channels: [] } })).toThrow();
    });
    
    it('should throw INVALID_CHANNEL if channel definition is missing required fields', () => {
      const invalidPlan = { ...validBasePlan, channels: [{ channel: 'WHATSAPP' }] }; // missing provider
      expect(() => executionPlanner.createExecutionPlan({ plan: invalidPlan })).toThrow();
      try { executionPlanner.createExecutionPlan({ plan: invalidPlan }); } catch (e) { expect(e.code).toBe('INVALID_CHANNEL'); }
    });
  });

  describe('Strategy Handling', () => {
    it('should default to SEQUENTIAL if no strategy is provided', () => {
      const result = executionPlanner.createExecutionPlan({ plan: validBasePlan });
      expect(result.strategy).toBe('SEQUENTIAL');
    });

    it('should support explicit SEQUENTIAL strategy', () => {
      const result = executionPlanner.createExecutionPlan({ plan: validBasePlan, strategy: 'SEQUENTIAL' });
      expect(result.strategy).toBe('SEQUENTIAL');
    });

    it('should support explicit PARALLEL strategy', () => {
      const result = executionPlanner.createExecutionPlan({ plan: validBasePlan, strategy: 'PARALLEL' });
      expect(result.strategy).toBe('PARALLEL');
    });

    it('should throw UNSUPPORTED_EXECUTION_STRATEGY for unknown strategy', () => {
      expect(() => executionPlanner.createExecutionPlan({ plan: validBasePlan, strategy: 'UNKNOWN' })).toThrow();
      try { executionPlanner.createExecutionPlan({ plan: validBasePlan, strategy: 'UNKNOWN' }); } catch (e) { expect(e.code).toBe('UNSUPPORTED_EXECUTION_STRATEGY'); }
    });
  });

  describe('Sequential Ordering', () => {
    it('should order steps primarily by priority ASC', () => {
      const plan = {
        ...validBasePlan,
        channels: [
          { channel: 'SMS', provider: 'TWILIO', priority: 3 },
          { channel: 'WHATSAPP', provider: 'META', priority: 1 },
          { channel: 'EMAIL', provider: 'SMTP', priority: 2 }
        ]
      };
      const result = executionPlanner.createExecutionPlan({ plan });
      expect(result.steps[0].channel).toBe('WHATSAPP');
      expect(result.steps[1].channel).toBe('EMAIL');
      expect(result.steps[2].channel).toBe('SMS');
    });

    it('should resolve equal priority using secondary deterministic ordering (channel ASC, then original index)', () => {
      const plan = {
        ...validBasePlan,
        channels: [
          { channel: 'WHATSAPP', provider: 'META_2', priority: 1 },
          { channel: 'EMAIL', provider: 'SMTP', priority: 1 },
          { channel: 'WHATSAPP', provider: 'META_1', priority: 1 }
        ]
      };
      const result = executionPlanner.createExecutionPlan({ plan });
      
      // EMAIL < WHATSAPP. Then WHATSAPP index 0 < WHATSAPP index 2
      expect(result.steps[0].channel).toBe('EMAIL');
      expect(result.steps[1].provider).toBe('META_2');
      expect(result.steps[2].provider).toBe('META_1');
    });
  });

  describe('Context Preservation', () => {
    it('should preserve context fields, preferring explicitly provided context over plan context', () => {
      const plan = {
        ...validBasePlan,
        correlationId: 'plan-corr',
        tenantId: 'plan-tenant'
      };
      const context = {
        eventId: 'evt-123',
        correlationId: 'ctx-corr'
      };

      const result = executionPlanner.createExecutionPlan({ plan, context });

      // Execution plan level
      expect(result.correlationId).toBe('ctx-corr');
      
      // Step level
      const step = result.steps[0];
      expect(step.context.eventId).toBe('evt-123');
      expect(step.context.correlationId).toBe('ctx-corr');
      expect(step.context.tenantId).toBe('plan-tenant'); // from plan, as context didn't provide
    });
  });

  describe('Duplicate Channels', () => {
    it('should preserve duplicate channels if passed by the registry', () => {
      const plan = {
        ...validBasePlan,
        channels: [
          { channel: 'WHATSAPP', provider: 'META', priority: 1 },
          { channel: 'WHATSAPP', provider: 'META', priority: 1 }
        ]
      };
      const result = executionPlanner.createExecutionPlan({ plan });
      expect(result.steps.length).toBe(2);
    });
  });

  describe('Immutability', () => {
    it('should not mutate the input plan', () => {
      const plan = { ...validBasePlan };
      const originalString = JSON.stringify(plan);
      
      executionPlanner.createExecutionPlan({ plan });
      
      expect(JSON.stringify(plan)).toBe(originalString);
    });
  });

  describe('Legacy Payload', () => {
    it('should not crash on legacy payload, but throw a controlled error', () => {
      const legacyPayload = {
        allowed: true,
        channels: ['WHATSAPP'],
        recipientPhone: '123'
      };
      // legacyPayload has no 'plan' field
      expect(() => executionPlanner.createExecutionPlan({ plan: legacyPayload.plan })).toThrow('Communication plan is missing');
    });
  });
});
