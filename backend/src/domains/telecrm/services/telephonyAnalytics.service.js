const LeadCall = require('../models/leadCall.model');

/**
 * TelephonyAnalyticsService
 * Asynchronously aggregates call metrics, ring/talk averages, and recording upload reliability KPIs.
 */
class TelephonyAnalyticsService {
  async getAggregatedMetrics({ callerId, startDate, endDate } = {}) {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const baseQuery = {};
    if (callerId) baseQuery.callerId = callerId;
    if (startDate || endDate) {
      baseQuery.createdAt = {};
      if (startDate) baseQuery.createdAt.$gte = new Date(startDate);
      if (endDate) baseQuery.createdAt.$lte = new Date(endDate);
    }

    const allCalls = await LeadCall.find(baseQuery).select('createdAt callStatus durationSeconds talkDuration ringDuration recordingUrl uploadStatus').lean();

    let callsToday = 0;
    let callsThisWeek = 0;
    let callsThisMonth = 0;
    let connectedCalls = 0;
    let busyCalls = 0;
    let missedCalls = 0;
    let totalTalkSecs = 0;
    let totalRingSecs = 0;
    let recordedCount = 0;
    let uploadSuccessCount = 0;

    for (const c of allCalls) {
      const dt = new Date(c.createdAt);
      if (dt >= startOfToday) callsToday++;
      if (dt >= startOfWeek) callsThisWeek++;
      if (dt >= startOfMonth) callsThisMonth++;

      if (c.callStatus === 'Connected') connectedCalls++;
      else if (c.callStatus === 'Busy') busyCalls++;
      else if (['Missed', 'No Answer'].includes(c.callStatus)) missedCalls++;

      totalTalkSecs += Number(c.talkDuration || c.durationSeconds || 0);
      totalRingSecs += Number(c.ringDuration || 0);

      if (c.recordingUrl) recordedCount++;
      if (c.uploadStatus === 'SUCCESS' || c.recordingUrl) uploadSuccessCount++;
    }

    const totalCalls = allCalls.length;
    const avgTalkTime = connectedCalls > 0 ? Math.round(totalTalkSecs / connectedCalls) : 0;
    const avgRingTime = totalCalls > 0 ? Math.round(totalRingSecs / totalCalls) : 0;
    const totalTalkHours = Number((totalTalkSecs / 3600).toFixed(2));
    const recordingSuccessRate = totalCalls > 0 ? Math.round((recordedCount / totalCalls) * 100) : 0;
    const uploadSuccessRate = recordedCount > 0 ? Math.round((uploadSuccessCount / recordedCount) * 100) : 100;

    return {
      callsToday,
      callsThisWeek,
      callsThisMonth,
      totalCalls,
      connectedCalls,
      busyCalls,
      missedCalls,
      averageTalkTimeSecs: avgTalkTime,
      averageRingTimeSecs: avgRingTime,
      totalTalkHours,
      recordingSuccessRate,
      uploadSuccessRate
    };
  }
}

module.exports = new TelephonyAnalyticsService();
