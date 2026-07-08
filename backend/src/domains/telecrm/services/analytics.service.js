const Lead = require('../models/lead.model');
const LeadCall = require('../models/leadCall.model');
const WorkingSession = require('../models/workingSession.model');

class AnalyticsService {
  async getExecutiveMetrics(userId) {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayStart = new Date(todayStr);

    const assignedCount = await Lead.countDocuments({ assignedEmployee: userId });
    const callsToday = await LeadCall.find({ callerId: userId, createdAt: { $gte: todayStart } }).lean();

    let attempts = callsToday.length;
    let connected = 0;
    let busy = 0;
    let noAnswer = 0;
    let totalTalkTime = 0;
    let meetings = 0;
    let interested = 0;
    let converted = 0;

    callsToday.forEach(c => {
      if (c.callStatus === 'Connected') {
        connected++;
        totalTalkTime += (c.talkDuration || c.durationSeconds || 0);
      } else if (c.callStatus === 'Busy') busy++;
      else if (c.callStatus === 'No Answer') noAnswer++;

      if (c.needMeeting) meetings++;
      if (c.interested) interested++;
      if (c.convertedToProspect) converted++;
    });

    const avgTalkTime = connected > 0 ? Math.round(totalTalkTime / connected) : 0;
    const connectionRate = attempts > 0 ? Math.round((connected / attempts) * 100) : 0;
    const conversionRate = connected > 0 ? Math.round((converted / connected) * 100) : 0;

    const session = await WorkingSession.findOne({ userId, date: todayStr }).lean();
    const workingSeconds = session ? (session.durations.Calling || 0) + (session.durations.Available || 0) + (session.durations.AfterCallWork || 0) : 0;
    const idleSeconds = session ? (session.durations.Idle || 0) : 0;

    return {
      assignedLeads: assignedCount,
      callsAttempted: attempts,
      callsConnected: connected,
      busyCalls: busy,
      noAnswerCalls: noAnswer,
      meetings,
      interested,
      converted,
      totalTalkTime,
      averageTalkTime: avgTalkTime,
      connectionRate,
      conversionRate,
      workingTimeMinutes: Math.round(workingSeconds / 60),
      idleTimeMinutes: Math.round(idleSeconds / 60)
    };
  }

  async getCeoAndManagerAnalytics() {
    const totalLeads = await Lead.countDocuments();
    const totalCalls = await LeadCall.countDocuments();
    const connectedCalls = await LeadCall.countDocuments({ callStatus: 'Connected' });
    const convertedLeads = await Lead.countDocuments({ currentStatus: 'Converted' });

    // Funnel
    const newLeads = await Lead.countDocuments({ currentStatus: 'New' });
    const callingLeads = await Lead.countDocuments({ currentStatus: 'Calling' });
    const interestedLeads = await LeadCall.countDocuments({ interested: true });
    const meetingLeads = await LeadCall.countDocuments({ needMeeting: true });

    return {
      funnel: {
        imported: totalLeads,
        assigned: totalLeads - newLeads,
        called: callingLeads,
        connected: connectedCalls,
        interested: interestedLeads,
        meetings: meetingLeads,
        converted: convertedLeads
      },
      kpi: {
        totalLeads,
        totalCalls,
        connectionRate: totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0,
        conversionRate: totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0
      }
    };
  }
}

module.exports = new AnalyticsService();
