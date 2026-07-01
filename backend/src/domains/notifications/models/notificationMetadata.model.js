/**
 * notificationMetadata.model.js
 * Normalized schema for tracking core communication metadata, status lifecycle, and idempotency.
 */

const mongoose = require('mongoose');

const notificationMetadataSchema = new mongoose.Schema({
  notificationId:    { type: String, required: true, unique: true, index: true },
  correlationId:     { type: String, required: true, index: true },
  eventId:           { type: String, required: true, index: true },
  notificationHash:  { type: String, index: true }, // Idempotency hash: eventId + recipient + template
  eventName:         { type: String, required: true, index: true },
  channel:           { 
    type: String, 
    enum: ['WHATSAPP', 'EMAIL', 'SMS', 'PUSH', 'SLACK', 'TEAMS'], 
    default: 'WHATSAPP',
    index: true
  },
  provider:          { type: String, default: 'META_CLOUD_API' },
  category:          { 
    type: String, 
    enum: ['UTILITY', 'PAYMENT', 'ORDER', 'REMINDER', 'FOLLOWUP', 'MARKETING', 'OTP', 'SYSTEM'], 
    default: 'UTILITY' 
  },
  priority:          { 
    type: String, 
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], 
    default: 'MEDIUM' 
  },
  recipientPhone:    { type: String, required: true, index: true },
  recipientEmail:    { type: String },
  templateName:      { type: String },
  templateVersion:   { type: String, default: 'v1.0' },
  language:          { type: String, default: 'en_US' },
  providerMessageId: { type: String, index: true },
  conversationId:    { type: String },
  status:            { 
    type: String, 
    enum: ['PENDING', 'QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED', 'EXPIRED', 'DLQ'], 
    default: 'PENDING',
    index: true 
  },
  retryCount:        { type: Number, default: 0 },
  scheduledAt:       { type: Date, default: Date.now },
  sentAt:            { type: Date },
  deliveredAt:       { type: Date },
  readAt:            { type: Date },
  failedAt:          { type: Date },
  errorMessage:      { type: String },
  tenantId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', index: true },
  createdBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Compound index for idempotency enforcement and deduplication queries
notificationMetadataSchema.index({ eventId: 1, recipientPhone: 1, templateName: 1 });

module.exports = mongoose.models.NotificationMetadata || mongoose.model('NotificationMetadata', notificationMetadataSchema);
