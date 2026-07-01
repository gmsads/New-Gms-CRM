const mongoose = require('mongoose');

const qualityReviewSchema = new mongoose.Schema(
  {
    callId: { type: mongoose.Schema.Types.ObjectId, ref: 'LeadCall', required: true, unique: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
    executiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewerName: { type: String, required: true },
    
    scores: {
      greeting: { type: Number, min: 1, max: 10, required: true },
      communicationQuality: { type: Number, min: 1, max: 10, required: true },
      requirementUnderstanding: { type: Number, min: 1, max: 10, required: true },
      objectionHandling: { type: Number, min: 1, max: 10, required: true },
      closingSkill: { type: Number, min: 1, max: 10, required: true },
      professionalism: { type: Number, min: 1, max: 10, required: true }
    },
    
    overallPercentage: { type: Number, required: true },
    rating: { type: String, enum: ['Excellent', 'Good', 'Average', 'Needs Improvement', 'Unacceptable'], default: 'Good' },
    
    coachingNotes: { type: String, trim: true },
    actionItems: { type: [String], default: [] }
  },
  { timestamps: true }
);

qualityReviewSchema.index({ executiveId: 1, createdAt: -1 });
qualityReviewSchema.index({ callId: 1 });

module.exports = mongoose.models.QualityReview || mongoose.model('QualityReview', qualityReviewSchema);
