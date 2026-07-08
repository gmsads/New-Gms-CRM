const mongoose = require('mongoose');

const incentiveRuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  rolesTargeted: [{
    type: String,
    required: true
  }],
  departmentsTargeted: [{
    type: String
  }],
  slabs: [{
    minScore: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    payoutPercentage: { type: Number, required: true }, // e.g., 100 for 100% of bonus
    fixedBonusAmount: { type: Number }
  }],
  ruleType: {
    type: String,
    enum: ['INDIVIDUAL_IPS', 'TEAM_TPS', 'BRANCH_BPS'],
    default: 'INDIVIDUAL_IPS'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('IncentiveRule', incentiveRuleSchema);
