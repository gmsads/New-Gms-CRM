const FraudAlert = require('../models/fraudAlert.model');
const LeadCall = require('../models/leadCall.model');

class FraudDetectionService {
  async inspectCompletedCall(call, user) {
    if (!call || !user) return;

    const executiveId = user._id || call.callerId;
    const executiveName = user.name || call.callerName || 'Executive';

    // 1. Check for Short Call Burst (< 3 seconds marked as Connected)
    if (call.callStatus === 'Connected' && (call.talkDuration || call.durationSeconds || 0) < 3) {
      await FraudAlert.create({
        executiveId,
        executiveName,
        alertType: 'SHORT_CALL_BURST',
        severity: 'MEDIUM',
        details: `Connected call completed in ${call.talkDuration || 0} seconds (< 3s threshold).`,
        relatedCallId: call._id,
        relatedLeadId: call.leadId
      });
    }

    // 2. Check for Connected Call without Recording
    if (call.callStatus === 'Connected' && (call.talkDuration || 0) > 10 && !call.recordingUrl) {
      await FraudAlert.create({
        executiveId,
        executiveName,
        alertType: 'UNRECORDED_CONNECT',
        severity: 'LOW',
        details: `Call connected for ${call.talkDuration}s but no recording URL saved.`,
        relatedCallId: call._id,
        relatedLeadId: call.leadId
      });
    }

    // 3. Check for Fake Disposition (e.g., marked Interested or Meeting Scheduled on a < 5s call)
    if ((call.interested || call.needMeeting) && (call.talkDuration || 0) < 5 && call.callStatus === 'Connected') {
      await FraudAlert.create({
        executiveId,
        executiveName,
        alertType: 'FAKE_DISPOSITION',
        severity: 'HIGH',
        details: `Marked Interested/Meeting on a ${call.talkDuration}s call.`,
        relatedCallId: call._id,
        relatedLeadId: call.leadId
      });
    }

    // 4. Check for Excessive Wrong Numbers in last 1 hour
    if (call.callStatus === 'Wrong Number') {
      const oneHourAgo = new Date(Date.now() - 3600000);
      const wrongCount = await LeadCall.countDocuments({
        callerId: executiveId,
        callStatus: 'Wrong Number',
        createdAt: { $gte: oneHourAgo }
      });
      if (wrongCount >= 5) {
        await FraudAlert.create({
          executiveId,
          executiveName,
          alertType: 'EXCESSIVE_WRONG_NUMBERS',
          severity: 'HIGH',
          details: `Marked ${wrongCount} leads as Wrong Number within the last 1 hour.`,
          relatedCallId: call._id,
          relatedLeadId: call.leadId
        });
      }
    }
  }

  async getOpenAlerts() {
    return await FraudAlert.find({ status: 'OPEN' }).sort({ createdAt: -1 }).limit(50).lean();
  }
}

module.exports = new FraudDetectionService();
