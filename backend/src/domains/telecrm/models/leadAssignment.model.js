const mongoose = require('mongoose');

const leadAssignmentSchema = new mongoose.Schema(
  {
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedByName: { type: String, default: 'System' },
    
    method: {
      type: String,
      enum: ['Manual', 'Round Robin', 'Single Employee', 'Employee Mapping', 'On Demand', 'Rule Based'],
      required: true
    },
    
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeleCampaign', default: null },
    batchId: { type: String, default: null },
    remarks: { type: String, trim: true }
  },
  { timestamps: true }
);

leadAssignmentSchema.index({ leadId: 1, createdAt: -1 });
leadAssignmentSchema.index({ assignedTo: 1 });
leadAssignmentSchema.index({ campaignId: 1 });

module.exports = mongoose.models.LeadAssignment || mongoose.model('LeadAssignment', leadAssignmentSchema);
