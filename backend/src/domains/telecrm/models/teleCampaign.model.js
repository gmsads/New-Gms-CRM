const mongoose = require('mongoose');

const teleCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    campaignType: { 
      type: String, 
      enum: ['Inbound', 'Outbound', 'Blended', 'Social', 'API', 'Event'], 
      default: 'Outbound' 
    },
    pipeline: {
      type: String,
      enum: ['Tele Sales', 'Sales', 'Appointment', 'Quotation', 'Order', 'Advertising', 'Marketing', 'Support', 'Other'],
      default: 'Advertising'
    },
    campaignManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    agents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    leadSource: { type: String, default: 'Excel' },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Paused', 'Completed'],
      default: 'Draft'
    },
    expectedLeads: { type: Number, default: 0 },
    totalLeadsCount: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
    notes: { type: String },
    
    distributionMethod: {
      type: String,
      enum: ['On Demand', 'Equal Distribution', 'Rule Based Distribution', 'Equal', 'Conditional'],
      default: 'On Demand'
    },
    
    batchSize: { type: Number, default: 10 },
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

const softDeletePlugin = require('../../../utils/softDelete.plugin');
teleCampaignSchema.plugin(softDeletePlugin);

teleCampaignSchema.index({ status: 1, createdAt: -1 });
teleCampaignSchema.index({ campaignManager: 1 });
teleCampaignSchema.index({ agents: 1 });

module.exports = mongoose.models.TeleCampaign || mongoose.model('TeleCampaign', teleCampaignSchema);
