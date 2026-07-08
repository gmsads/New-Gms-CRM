/**
 * communicationAuditLog.model.js
 * Technical audit trail capturing API attempts, status codes, and sanitized payload summaries without bloat.
 */

const mongoose = require('mongoose');

const communicationAuditLogSchema = new mongoose.Schema({
  notificationId:    { type: String, required: true, index: true },
  correlationId:     { type: String, required: true, index: true },
  attemptNumber:     { type: Number, required: true, default: 1 },
  action:            { type: String, required: true }, // e.g. 'API_REQUEST', 'API_RESPONSE', 'WEBHOOK_UPDATE', 'DLQ_ENTERED'
  httpStatusCode:    { type: Number },
  providerMessageId: { type: String, index: true },
  errorCode:         { type: String },
  errorMessage:      { type: String },
  compactPayload:    { type: mongoose.Schema.Types.Mixed }, // Sanitized essential fields only
  timestamp:         { type: Date, default: Date.now, index: true }
}, { timestamps: false });

communicationAuditLogSchema.index({ notificationId: 1, timestamp: -1 });

module.exports = mongoose.models.CommunicationAuditLog || mongoose.model('CommunicationAuditLog', communicationAuditLogSchema);
