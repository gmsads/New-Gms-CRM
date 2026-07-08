const mongoose = require('mongoose');

const leadActivitySchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    performedByName: { type: String, default: 'System' },
    
    activityType: {
      type: String,
      required: true // e.g., CREATED, IMPORTED, ASSIGNED, STATUS_CHANGED, CALL_MADE, WHATSAPP_SENT, REMARK_ADDED, FOLLOWUP_SCHEDULED, CONVERTED
    },
    
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

leadActivitySchema.index({ leadId: 1, timestamp: -1 });

module.exports = mongoose.models.LeadActivity || mongoose.model('LeadActivity', leadActivitySchema);
