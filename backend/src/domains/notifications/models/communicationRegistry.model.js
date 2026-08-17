const mongoose = require('mongoose');

const retryPolicySchema = new mongoose.Schema({
  maxRetries: { type: Number, default: 3 },
  retryDelay: { type: Number, default: 5000 }, // milliseconds
  rateLimit: { type: Number }, // e.g., messages per second
  timeout: { type: Number, default: 10000 } // milliseconds
}, { _id: false });

const communicationRegistrySchema = new mongoose.Schema({
  eventName: { type: String, required: true, uppercase: true, index: true },
  version: { type: Number, required: true, default: 1 },
  channels: [{ type: String, uppercase: true }], // e.g. WHATSAPP, EMAIL, SMS
  providerPriority: [{ type: String, uppercase: true }], // e.g. META, GUPSHUP, TWILIO
  retryPolicy: { type: retryPolicySchema, default: () => ({}) },
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'MEDIUM' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null }, // Null means global
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null }, // Null means global
  featureFlag: { type: String, default: null },
  sandboxEnabled: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true, index: true },
  effectiveFrom: { type: Date, default: Date.now },
  effectiveTo: { type: Date, default: null },
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true 
});

// Composite index for fast lookup of active rules
communicationRegistrySchema.index({ eventName: 1, tenantId: 1, branchId: 1, isActive: 1 });

module.exports = mongoose.model('CommunicationRegistry', communicationRegistrySchema);
