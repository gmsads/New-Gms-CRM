/**
 * communicationWorker.js
 * Consumes dispatch jobs from communicationQueue, executes network dispatch via ProviderFactory,
 * and maintains normalized 3-tier enterprise storage logs.
 */

const { communicationQueue, useBullMQ, connection } = require('../queues/communicationQueue');
const providerFactory = require('../../domains/notifications/providers/providerFactory');
const NotificationMetadata = require('../../domains/notifications/models/notificationMetadata.model');
const CommunicationTimeline = require('../../domains/notifications/models/communicationTimeline.model');
const CommunicationAuditLog = require('../../domains/notifications/models/communicationAuditLog.model');

const processNotificationDispatch = async (job) => {
  const {
    notificationId,
    correlationId,
    eventId,
    eventName,
    channel = 'WHATSAPP',
    payload,
    title,
    summary,
    customerId,
    orderId,
    paymentId,
    tenantId
  } = job.data;

  const attemptNumber = (job.attemptsMade || 0) + 1;
  console.log(`[CommunicationWorker] Dispatched ${notificationId} via ${channel} (Attempt ${attemptNumber})`);

  try {
    // 1. Update status to PROCESSING
    await NotificationMetadata.findOneAndUpdate(
      { notificationId },
      { status: 'PROCESSING', retryCount: attemptNumber - 1 }
    );

    // 2. Resolve Provider & Format payload
    const provider = providerFactory.getProvider(channel);
    const formattedData = provider.formatPayload(payload);

    // Log API request attempt
    await CommunicationAuditLog.create({
      notificationId,
      correlationId,
      attemptNumber,
      action: 'API_REQUEST',
      compactPayload: { to: formattedData.to, template: formattedData?.template?.name }
    });

    // 3. Send over network
    const result = await provider.send(formattedData, { tenantId });

    if (result.success) {
      const now = new Date();
      // Update Metadata
      await NotificationMetadata.findOneAndUpdate(
        { notificationId },
        {
          status: 'SENT',
          sentAt: now,
          providerMessageId: result.messageId,
          retryCount: attemptNumber
        }
      );

      // Append Timeline
      await CommunicationTimeline.create({
        customerId,
        orderId,
        paymentId,
        notificationId,
        correlationId,
        channel,
        direction: 'OUTBOUND',
        title: title || `WhatsApp Notification Sent`,
        summary: summary || `Sent template ${payload.templateName} to ${payload.recipientPhone}`,
        status: 'SENT',
        sentAt: now
      });

      // Log success audit
      await CommunicationAuditLog.create({
        notificationId,
        correlationId,
        attemptNumber,
        action: 'API_RESPONSE',
        httpStatusCode: result.statusCode || 200,
        providerMessageId: result.messageId,
        compactPayload: { success: true, messageId: result.messageId }
      });

      console.log(`[CommunicationWorker] ✅ Notification ${notificationId} sent successfully (MsgID: ${result.messageId})`);
    } else {
      throw new Error(result.error || 'Provider dispatch unsuccessful');
    }
  } catch (err) {
    console.error(`[CommunicationWorker] ❌ Failed notification ${notificationId}:`, err.message);

    // Record failure in audit log
    await CommunicationAuditLog.create({
      notificationId,
      correlationId,
      attemptNumber,
      action: 'API_ERROR',
      errorMessage: err.message
    });

    // Update metadata status
    await NotificationMetadata.findOneAndUpdate(
      { notificationId },
      {
        status: 'FAILED',
        failedAt: new Date(),
        errorMessage: err.message,
        retryCount: attemptNumber
      }
    );

    throw err; // Re-throw to trigger BullMQ / Fallback exponential retry
  }
};

let workerInstance = null;

const startCommunicationWorker = () => {
  if (useBullMQ && connection) {
    const { Worker } = require('bullmq');
    workerInstance = new Worker('communicationQueue', processNotificationDispatch, { connection });
    workerInstance.on('completed', job => console.log(`[CommunicationWorker] Job ${job.id} finished.`));
    workerInstance.on('failed', async (job, err) => {
      console.error(`[CommunicationWorker] Job ${job?.id} failed:`, err.message);
      if (job && job.attemptsMade >= job.opts.attempts) {
        // Move to DLQ
        await NotificationMetadata.findOneAndUpdate(
          { notificationId: job.data.notificationId },
          { status: 'DLQ' }
        );
      }
    });
  } else {
    communicationQueue.registerWorker(processNotificationDispatch);
    console.log('[CommunicationWorker] Registered async processor on FallbackQueue.');
  }
};

module.exports = { startCommunicationWorker, processNotificationDispatch };
