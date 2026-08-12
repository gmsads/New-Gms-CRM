/**
 * executionStepBuilder.js
 * Builds individual execution steps from channel configurations.
 */

const crypto = require('crypto');

class ExecutionStepBuilder {
  /**
   * Builds an array of self-contained Execution Steps.
   * @param {Array} channels - The channels from the Communication Plan.
   * @param {Object} executionContext - Context inherited from the plan and execution request.
   * @param {string} strategy - The resolved execution strategy.
   * @returns {Array} An array of Execution Steps.
   */
  buildSteps(channels, executionContext, strategy) {
    if (!channels || !Array.isArray(channels)) {
      return [];
    }

    // Step 1: Create raw steps
    let steps = channels.map((channelObj, index) => {
      // Validate channel structure
      if (!channelObj.channel || !channelObj.provider) {
        const error = new Error(`Invalid channel definition at index ${index}`);
        error.code = 'INVALID_CHANNEL';
        throw error;
      }
      
      const priority = typeof channelObj.priority === 'number' ? channelObj.priority : 99;

      return {
        stepId: crypto.randomUUID(),
        type: 'CHANNEL',
        channel: channelObj.channel,
        provider: channelObj.provider,
        priority: priority,
        condition: 'ALWAYS',
        delay: 0,
        metadata: {
          originalIndex: index // Used for secondary deterministic ordering
        },
        context: {
          eventId: executionContext.eventId || null,
          correlationId: executionContext.correlationId || null,
          tenantId: executionContext.tenantId || null,
          branchId: executionContext.branchId || null
        }
      };
    });

    // Step 2: Apply strategy-specific ordering
    if (strategy === 'SEQUENTIAL') {
      // O(N log N) deterministic sort.
      // Primary: priority ASC
      // Secondary: channel name ASC
      // Tertiary: originalIndex ASC
      steps.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        if (a.channel !== b.channel) {
          return a.channel.localeCompare(b.channel);
        }
        return a.metadata.originalIndex - b.metadata.originalIndex;
      });
    }

    return steps;
  }
}

module.exports = new ExecutionStepBuilder();
