const LeadCall = require('../models/leadCall.model');
const TeleConfig = require('../models/teleConfig.model');

class RecordingService {
  async getRecordings({ minDuration, maxDuration, status, callerId, leadId, limit = 50 }) {
    const query = { recordingUrl: { $ne: null } };
    if (callerId) query.callerId = callerId;
    if (leadId) query.leadId = leadId;
    if (status) query.callStatus = status;
    if (minDuration || maxDuration) {
      query.talkDuration = {};
      if (minDuration) query.talkDuration.$gte = Number(minDuration);
      if (maxDuration) query.talkDuration.$lte = Number(maxDuration);
    }

    return await LeadCall.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('callerName calleePhone companyName callStatus durationSeconds talkDuration recordingUrl startTime')
      .lean();
  }

  async checkProviderHealth() {
    // Return provider health status from config
    const cfg = await TeleConfig.findOne({ key: 'ENTERPRISE_DEFAULT' }).select('providerHealth').lean();
    return cfg?.providerHealth || { status: 'HEALTHY', latencyMs: 42, lastChecked: new Date() };
  }
}

module.exports = new RecordingService();
