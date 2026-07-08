const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema({
  field: { type: String, required: true }, // e.g., state, businessCategory, source, priority
  operator: { 
    type: String, 
    enum: ['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN', 'IN'], 
    required: true 
  },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

const campaignRuleSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeleCampaign', required: true },
    name: { type: String, required: true, trim: true },
    ruleOrder: { type: Number, default: 0 },
    
    logic: { type: String, enum: ['AND', 'OR'], default: 'AND' },
    conditions: [conditionSchema],
    
    assignToUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fallbackUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

campaignRuleSchema.index({ campaignId: 1, ruleOrder: 1 });

module.exports = mongoose.models.CampaignRule || mongoose.model('CampaignRule', campaignRuleSchema);
