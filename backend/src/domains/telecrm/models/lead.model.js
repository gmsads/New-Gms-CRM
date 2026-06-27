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
    convertedAt: { type: Date, default: null }
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
