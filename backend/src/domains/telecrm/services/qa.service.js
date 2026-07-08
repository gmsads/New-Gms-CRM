const QualityReview = require('../models/qualityReview.model');
const LeadCall = require('../models/leadCall.model');
const auditService = require('./audit.service');

class QaService {
  async submitReview({ callId, reviewerId, reviewerName, scores, coachingNotes, actionItems }) {
    const call = await LeadCall.findById(callId);
    if (!call) throw new Error('Call record not found');

    const totalScore = (
      (scores.greeting || 5) +
      (scores.communicationQuality || 5) +
      (scores.requirementUnderstanding || 5) +
      (scores.objectionHandling || 5) +
      (scores.closingSkill || 5) +
      (scores.professionalism || 5)
    );
    const percentage = Math.round((totalScore / 60) * 100);

    let rating = 'Good';
    if (percentage >= 90) rating = 'Excellent';
    else if (percentage >= 75) rating = 'Good';
    else if (percentage >= 60) rating = 'Average';
    else if (percentage >= 40) rating = 'Needs Improvement';
    else rating = 'Unacceptable';

    const review = await QualityReview.findOneAndUpdate(
      { callId },
      {
        $set: {
          leadId: call.leadId,
          executiveId: call.callerId,
          reviewerId,
          reviewerName: reviewerName || 'QA Manager',
          scores,
          overallPercentage: percentage,
          rating,
          coachingNotes: coachingNotes || '',
          actionItems: actionItems || []
        }
      },
      { new: true, upsert: true }
    );

    await auditService.log({
      userId: reviewerId,
      userName: reviewerName,
      action: 'QA_REVIEW_SUBMITTED',
      targetId: review._id,
      targetModel: 'QualityReview',
      newValue: { callId, percentage, rating }
    });

    return review;
  }

  async getReviewsForExecutive(executiveId) {
    return await QualityReview.find({ executiveId }).sort({ createdAt: -1 }).limit(20).lean();
  }
}

module.exports = new QaService();
