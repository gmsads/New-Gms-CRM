const mongoose = require('mongoose');

const kpiConfigSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    required: true,
    index: true
  },
  department: {
    type: String,
    index: true
  },
  weightage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  baseMetric: {
    type: String,
    enum: [
      'REVENUE_ACHIEVED',
      'CONVERSION_RATE',
      'FOLLOWUP_ADHERENCE',
      'DATA_QUALITY',
      'TURNAROUND_TIME',
      'REVISION_RATE',
      'APPROVAL_RATE',
      'SLA_ACHIEVEMENT',
      'COMPLETION_RATE',
      'ESCALATION_HANDLING',
      'ATTENDANCE_RATE'
    ],
    required: true
  },
  scoreRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 }
  },
  evaluationFrequency: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'],
    default: 'MONTHLY'
  },
  targetValue: {
    type: Number,
    required: true
  },
  formulaLogic: {
    // Stores how to compute score relative to targetValue
    // e.g., 'HIGHER_IS_BETTER', 'LOWER_IS_BETTER', 'PERCENTAGE'
    type: String,
    enum: ['HIGHER_IS_BETTER', 'LOWER_IS_BETTER', 'PERCENTAGE'],
    default: 'PERCENTAGE'
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

module.exports = mongoose.model('KpiConfig', kpiConfigSchema);
