const mongoose = require('mongoose');

const leadFollowupSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String },
    
    followupDate: { type: String, required: true }, // YYYY-MM-DD format
    followupTime: { type: String },                 // HH:mm format
    scheduledAt: { type: Date, required: true },
    
    remarks: { type: String, required: true, trim: true },
    
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Overdue', 'Cancelled'],
      default: 'Pending'
    },
    
    completedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

leadFollowupSchema.index({ userId: 1, status: 1, scheduledAt: 1 });
leadFollowupSchema.index({ leadId: 1 });

module.exports = mongoose.models.LeadFollowup || mongoose.model('LeadFollowup', leadFollowupSchema);
