const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema(
  {
    leadNumber: { type: String, required: true, unique: true, trim: true },
    companyName: { type: String, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, trim: true },
    businessCategory: { type: String, trim: true },
    
    source: {
      type: String,
      default: 'Manual Entry'
    },
    
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'TeleCampaign', default: null },
    campaignName: { type: String, trim: true },
    
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    
    currentStatus: {
      type: String,
      enum: [
        'New', 'Calling', 'Connected', 'Busy', 'Not Reachable', 
        'Interested', 'Qualified', 'Converted', 'Not Interested', 'Lost'
      ],
      default: 'New'
    },
    
    assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedDate: { type: Date, default: null },
    
    lastFollowUpDate: { type: Date, default: null },
    lastRemark: { type: String, trim: true },
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    
    timeline: [{
      type: { type: String, required: true }, // e.g. CREATED, IMPORTED, CALL, REMARK, STATUS_CHANGE
      title: { type: String, required: true },
      description: { type: String },
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      performedByName: { type: String },
      timestamp: { type: Date, default: Date.now }
    }],
    
    convertedToProspectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect', default: null },
    convertedAt: { type: Date, default: null },

    // Enterprise Queue & Operations (Additive)
    queueCategory: {
      type: String,
      enum: ['New', 'Today', 'Tomorrow', 'Retry', 'Follow-up', 'Hot Leads', 'Meeting', 'Manager Review', 'Lost'],
      default: 'New'
    },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    lockedUntil: { type: Date, default: null },
    
    nextRetryDate: { type: Date, default: null },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    
    slaStatus: { type: String, enum: ['ON_TIME', 'AT_RISK', 'BREACHED'], default: 'ON_TIME' },
    firstCalledAt: { type: Date, default: null },
    
    agingDays: { type: Number, default: 0 },
    agingBucket: {
      type: String,
      enum: ['Today', '1 Day', '2 Days', '3 Days', '4-7 Days', '8-15 Days', '15+ Days'],
      default: 'Today'
    },
    
    pan: { type: String, trim: true },
    gst: { type: String, trim: true },
    website: { type: String, trim: true },
    
    transferHistory: [{
      fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      transferredAt: { type: Date, default: Date.now },
      reason: String
    }]
  },
  { timestamps: true, optimisticConcurrency: true }
);

const softDeletePlugin = require('../../../utils/softDelete.plugin');
leadSchema.plugin(softDeletePlugin);

// Compound indexes for enterprise throughput
leadSchema.index({ assignedEmployee: 1, currentStatus: 1 });
leadSchema.index({ assignedEmployee: 1, priority: 1 });
leadSchema.index({ phone: 1, email: 1 });
leadSchema.index({ campaign: 1, currentStatus: 1 });
leadSchema.index({ createdAt: -1 });

// Text index for fast multi-column search
leadSchema.index({ companyName: 'text', contactPerson: 'text', phone: 'text', email: 'text', city: 'text' });

module.exports = mongoose.models.Lead || mongoose.model('Lead', leadSchema);
