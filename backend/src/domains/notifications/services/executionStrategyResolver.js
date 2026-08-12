/**
 * executionStrategyResolver.js
 * Resolves and validates execution strategies for Communication Plans.
 */

const SUPPORTED_STRATEGIES = ['SEQUENTIAL', 'PARALLEL'];
const DEFAULT_STRATEGY = 'SEQUENTIAL';

class ExecutionStrategyResolver {
  /**
   * Resolves the strategy, applying defaults and validating against supported strategies.
   * @param {string} strategy 
   * @returns {string} The normalized valid strategy.
   * @throws {Error} if the strategy is unsupported.
   */
  resolve(strategy) {
    const resolvedStrategy = strategy ? strategy.toUpperCase() : DEFAULT_STRATEGY;

    if (!SUPPORTED_STRATEGIES.includes(resolvedStrategy)) {
      const error = new Error(`Unsupported execution strategy: ${resolvedStrategy}`);
      error.code = 'UNSUPPORTED_EXECUTION_STRATEGY';
      throw error;
    }

    return resolvedStrategy;
  }
}

module.exports = new ExecutionStrategyResolver();
