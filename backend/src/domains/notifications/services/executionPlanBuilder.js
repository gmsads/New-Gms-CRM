/**
 * executionPlanBuilder.js
 * Assembles the final Execution Plan.
 */

const crypto = require('crypto');

class ExecutionPlanBuilder {
  /**
   * Assembles the Execution Plan from the provided context, strategy, and steps.
   * @param {Object} plan - The original Communication Plan.
   * @param {Object} executionContext - The context.
   * @param {string} strategy - The resolved execution strategy.
   * @param {Array} steps - The generated execution steps.
   * @returns {Object} The complete Execution Plan.
   */
  build(plan, executionContext, strategy, steps) {
    // Determine context values. Explicit context overrides plan context.
    const correlationId = executionContext.correlationId || plan.correlationId || null;
    
    return {
      version: 1,
      executionId: crypto.randomUUID(),
      correlationId: correlationId,
      event: plan.event || 'UNKNOWN',
      strategy: strategy,
      source: plan.source || 'unknown',
      createdAt: new Date().toISOString(),
      steps: steps
    };
  }
}

module.exports = new ExecutionPlanBuilder();
