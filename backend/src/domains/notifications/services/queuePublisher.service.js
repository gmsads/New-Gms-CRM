/**
 * queuePublisher.service.js
 * Responsible for publishing notification dispatch jobs into communicationQueue with priority and retry policies.
 */

const crypto = require('crypto');
const NotificationMetadata = require('../models/notificationMetadata.model');

const PRIORITY_MAP = {
  CRITICAL: 1,
  HIGH:     2,
  MEDIUM:   3,
  LOW:      4
};

class QueuePublisherService {
  /**
   * Enqueues notification job or dispatches fallback worker if Redis queue is disabled.
   * @param {Object} jobData 
   * @returns {Promise<Object>}
   */
  async publish(jobData) {
    const {
      eventId,
      correlationId,
      eventName,
      channel = 'WHATSAPP',
      provider = 'META_CLOUD_API',
      payload,
      title,
      summary,
      customerId,
      orderId,
      paymentId,
      tenantId
    } = jobData;

    // Generate deterministic Idempotency Hash (eventId + recipient + template)
    const hashString = `${eventId}_${payload.recipientPhone}_${payload.templateName}`;
    const notificationHash = crypto.createHash('sha256').update(hashString).digest('hex');

    // 1. Check Idempotency: Ignore duplicate notification attempts
    const existing = await NotificationMetadata.findOne({
      $or: [
        { eventId, recipientPhone: payload.recipientPhone, templateName: payload.templateName },
        { correlationId, eventName, recipientPhone: payload.recipientPhone }
      ]
    });

    if (existing) {
      console.log(`[QueuePublisher] Duplicate notification detected for event ${eventName} (Corr: ${correlationId}, EventID: ${eventId}). Ignored.`);
      return { duplicate: true, notificationId: existing.notificationId };
    }

    const notificationId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // 2. Create Metadata Record in PENDING status
    const metadata = await NotificationMetadata.create({
      notificationId,
      correlationId,
      eventId,
      notificationHash,
      eventName,
      channel,
      provider,
      category: payload.category || 'UTILITY',
      priority: payload.priority || 'MEDIUM',
      recipientPhone: payload.recipientPhone,
      templateName: payload.templateName,
      templateVersion: payload.templateVersion,
      language: payload.language || 'en_US',
      status: 'QUEUED',
      tenantId
    });

    const priorityLevel = PRIORITY_MAP[payload.priority || 'MEDIUM'] || 3;

    // 3. Enqueue job into CommunicationQueue
    const { communicationQueue } = require('../../../services/queues/communicationQueue');
    
    await communicationQueue.add('dispatchNotification', {
      notificationId,
      correlationId,
      eventId,
      eventName,
      channel,
      provider,
      payload,
      title,
      summary,
      customerId,
      orderId,
      paymentId,
      tenantId
    }, {
      priority: priorityLevel,
      jobId: notificationId
    });

    return { success: true, notificationId, status: 'QUEUED' };
  }
}

module.exports = new QueuePublisherService();
