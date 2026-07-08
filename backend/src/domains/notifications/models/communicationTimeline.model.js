/**
 * communicationTimeline.model.js
 * Lightweight, queryable schema representing a customer's communication feed across all channels.
 */

const mongoose = require('mongoose');

const communicationTimelineSchema = new mongoose.Schema({
  customerId:     { type: mongoose.Schema.Types.Mixed, index: true },
  orderId:        { type: mongoose.Schema.Types.Mixed, index: true },
  paymentId:      { type: mongoose.Schema.Types.Mixed, index: true },
  notificationId: { type: String, required: true, index: true },
  correlationId:  { type: String, required: true, index: true },
  channel:        { type: String, enum: ['WHATSAPP', 'EMAIL', 'SMS', 'PUSH', 'SLACK', 'TEAMS'], required: true },
  direction:      { type: String, enum: ['OUTBOUND', 'INBOUND'], default: 'OUTBOUND' },
  title:          { type: String, required: true },
  summary:        { type: String, required: true },
  status:         { type: String, enum: ['SENT', 'DELIVERED', 'READ', 'FAILED'], default: 'SENT', index: true },
  sentAt:         { type: Date, default: Date.now },
  deliveredAt:    { type: Date },
  readAt:         { type: Date }
}, { timestamps: true });

communicationTimelineSchema.index({ customerId: 1, createdAt: -1 });
communicationTimelineSchema.index({ orderId: 1, createdAt: -1 });

module.exports = mongoose.models.CommunicationTimeline || mongoose.model('CommunicationTimeline', communicationTimelineSchema);
