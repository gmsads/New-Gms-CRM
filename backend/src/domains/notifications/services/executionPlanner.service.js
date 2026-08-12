/**
 * executionPlanner.service.js
 * The internal entry point for Enterprise Execution Planning (Phase 4).
 * Converts a Communication Plan into an Execution Plan.
 */

const strategyResolver = require('./executionStrategyResolver');
const stepBuilder = require('./executionStepBuilder');
const planBuilder = require('./executionPlanBuilder');

class ExecutionPlannerService {
  /**
   * Creates an Execution Plan from a Communication Plan.
   * @param {Object} input
   * @param {Object} input.plan - The Enterprise Communication Plan.
   * @param {Object} [input.context] - Execution context (e.g., eventId, correlationId).
   * @param {string} [input.strategy] - The requested execution strategy.
   * @returns {Object} The complete Execution Plan.
   * @throws {Error} if validation fails or strategy is unsupported.
   */
  createExecutionPlan({ plan, context = {}, strategy }) {
    // 1. Validation
    if (!plan) {
      const error = new Error('Communication plan is missing');
      error.code = 'MISSING_COMMUNICATION_PLAN';
      throw error;
    }

    if (typeof plan !== 'object' || Array.isArray(plan)) {
      const error = new Error('Communication plan must be an object');
      error.code = 'INVALID_COMMUNICATION_PLAN';
      throw error;
    }

    if (plan.version !== 1) {
      const error = new Error('Unsupported Communication Plan version');
      error.code = 'UNSUPPORTED_PLAN_VERSION';
      throw error;
    }

    if (!plan.event) {
      const error = new Error('Communication plan must have an event');
      error.code = 'INVALID_COMMUNICATION_PLAN';
      throw error;
    }

    if (!plan.channels || !Array.isArray(plan.channels) || plan.channels.length === 0) {
      const error = new Error('Communication plan must have at least one channel');
      error.code = 'MISSING_CHANNELS';
      throw error;
    }

    // Determine tenantId and branchId from context or plan, preferring context
    const executionContext = {
      eventId: context.eventId || null,
      correlationId: context.correlationId || plan.correlationId || null,
      tenantId: context.tenantId || plan.tenantId || null,
      branchId: context.branchId || plan.branchId || null
    };

    // 2. Resolve Strategy
    const resolvedStrategy = strategyResolver.resolve(strategy);

    // 3. Build Steps
    const steps = stepBuilder.buildSteps(plan.channels, executionContext, resolvedStrategy);

    // 4. Build Execution Plan
    const executionPlan = planBuilder.build(plan, executionContext, resolvedStrategy, steps);

    return executionPlan;
  }
}

module.exports = new ExecutionPlannerService();
