const mongoose = require('mongoose');

const performanceReviewSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  
  // Aggregate Scores over the period
  averageIps: { type: Number, required: true },
  
  grade: {
    type: String,
    enum: ['A+', 'A', 'B', 'C', 'D', 'F'],
    required: true
  },

  // HR / Manager inputs
  managerFeedback: { type: String },
  hrFeedback: { type: String },
  
  // Engine Recommendations
  systemRecommendation: {
    type: String,
    enum: ['PROMOTION_ELIGIBLE', 'SALARY_INCREMENT', 'STANDARD', 'WARNING', 'PIP_REQUIRED'],
    default: 'STANDARD'
  },
  
  // Final decision by HR
  finalAction: {
    type: String,
    enum: ['PROMOTED', 'INCREMENT_GRANTED', 'NO_ACTION', 'PIP_INITIATED', 'TERMINATED'],
    default: 'NO_ACTION'
  },
  
  reviewedByManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedByHR: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  status: {
    type: String,
    enum: ['DRAFT', 'MANAGER_REVIEW', 'HR_REVIEW', 'COMPLETED'],
    default: 'DRAFT'
  }
}, { timestamps: true });

module.exports = mongoose.model('PerformanceReview', performanceReviewSchema);
