/**
 * eventBus.service.js
 * Distributed event bus publisher. Business modules call this strictly after successful DB commits.
 */

const { eventBusQueue } = require('../../services/queues/communicationQueue');

class EventBusService {
  /**
   * Publishes a domain event asynchronously to the event bus queue.
   * @param {string} eventName - Standard event name from domainEvents.js
   * @param {Object} payload - Entity payload (Order, Payment, etc.)
   * @param {Object} [options] - Optional correlationId or tenantId
   * @returns {Promise<{ eventId: string, correlationId: string }>}
   */
  async publish(eventName, payload = {}, options = {}) {
    const eventId = `EVT-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const correlationId = options.correlationId || payload.correlationId || `CORR-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    // Publish non-blocking to eventBusQueue
    await eventBusQueue.add(eventName, {
      eventId,
      correlationId,
      eventName,
      payload,
      tenantId: options.tenantId || payload.tenantId,
      timestamp: new Date()
    });

    console.log(`[EventBus] Published event ${eventName} (ID: ${eventId}, Corr: ${correlationId})`);
    return { eventId, correlationId };
  }
}

module.exports = new EventBusService();
