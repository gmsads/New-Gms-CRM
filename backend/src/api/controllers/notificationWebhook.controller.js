/**
 * notificationWebhook.controller.js
 * Secure webhook handler for Meta Cloud API status notifications (Sent -> Delivered -> Read / Failed).
 */

const crypto = require('crypto');
const NotificationMetadata = require('../../domains/notifications/models/notificationMetadata.model');
const CommunicationTimeline = require('../../domains/notifications/models/communicationTimeline.model');
const CommunicationAuditLog = require('../../domains/notifications/models/communicationAuditLog.model');

// ── GET /api/webhooks/whatsapp ────────────────────────────────────────────────
// Meta Webhook Verification
exports.verifyWebhook = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WEBHOOK_VERIFY_TOKEN || 'gms_whatsapp_secret_token';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('[Webhook] ✅ Meta Cloud API webhook verified successfully.');
    return res.status(200).send(challenge);
  }

  console.warn('[Webhook] ❌ Verification failed. Invalid verify token provided.');
  return res.sendStatus(403);
};

// ── POST /api/webhooks/whatsapp ───────────────────────────────────────────────
// Incoming Delivery Status Updates or Inbound Messages
exports.handleIncoming = async (req, res) => {
  // Always return 200 OK immediately to Meta so webhook delivery is acknowledged
  res.sendStatus(200);

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value) continue;

        // Process status updates (delivered, read, failed)
        if (Array.isArray(value.statuses)) {
          for (const statusObj of value.statuses) {
            const providerMessageId = statusObj.id;
            const statusStr = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
            const timestamp = statusObj.timestamp ? new Date(parseInt(statusObj.timestamp, 10) * 1000) : new Date();

            const metadata = await NotificationMetadata.findOne({ providerMessageId });
            if (!metadata) {
              console.log(`[Webhook] Received status "${statusStr}" for untracked MsgID ${providerMessageId}`);
              continue;
            }

            const normalizedStatus = statusStr.toUpperCase(); // DELIVERED, READ, FAILED
            const updateFields = { status: normalizedStatus };

            if (normalizedStatus === 'DELIVERED') updateFields.deliveredAt = timestamp;
            if (normalizedStatus === 'READ') updateFields.readAt = timestamp;
            if (normalizedStatus === 'FAILED') {
              updateFields.failedAt = timestamp;
              const errDetails = statusObj.errors?.[0];
              updateFields.errorMessage = errDetails ? `${errDetails.code}: ${errDetails.title}` : 'Delivery failed';
            }

            await NotificationMetadata.findOneAndUpdate({ providerMessageId }, updateFields);

            // Update timeline
            await CommunicationTimeline.findOneAndUpdate(
              { notificationId: metadata.notificationId },
              { 
                status: normalizedStatus,
                ...(normalizedStatus === 'DELIVERED' && { deliveredAt: timestamp }),
                ...(normalizedStatus === 'READ' && { readAt: timestamp })
              }
            );

            // Append Audit Log
            await CommunicationAuditLog.create({
              notificationId: metadata.notificationId,
              correlationId: metadata.correlationId,
              attemptNumber: metadata.retryCount || 1,
              action: 'WEBHOOK_UPDATE',
              providerMessageId,
              compactPayload: { status: normalizedStatus, timestamp: timestamp.toISOString() }
            });

            console.log(`[Webhook] Updated notification ${metadata.notificationId} status to ${normalizedStatus}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[Webhook] Exception handling incoming webhook payload:', err);
  }
};
