const Lead = require('../models/lead.model');
const LeadCall = require('../models/leadCall.model');
const WorkingSession = require('../models/workingSession.model');
const LeadFollowup = require('../models/leadFollowup.model');
const LeadActivity = require('../models/leadActivity.model');

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

  async getExecutiveMyReports(userId, { filter = 'today', startDate, endDate } = {}) {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (filter === 'yesterday') {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (filter === 'this_week') {
      const day = now.getDay() || 7;
      start.setDate(now.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (filter === 'this_month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (filter === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // today
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    // 1 & 2 & 4. Calls & Dispositions
    const calls = await LeadCall.find({ callerId: userId, createdAt: { $gte: start, $lte: end } }).lean();
    let totalCalls = calls.length;
    let connectedCalls = 0;
    let totalCallTime = 0;
    let totalDispositions = 0;
    let connectedDispositions = 0;
    let notConnectedDispositions = 0;
    let convertedLeads = 0;

    calls.forEach(c => {
      const dur = c.talkDuration || c.durationSeconds || 0;
      if (c.callStatus === 'Connected') {
        connectedCalls++;
        totalCallTime += dur;
      }
      if (c.remarks || c.businessDisposition || c.callLifecycleStage === 'Disposed') {
        totalDispositions++;
        if (c.callStatus === 'Connected') connectedDispositions++;
        else notConnectedDispositions++;
      }
      if (c.convertedToProspect || (c.businessDisposition && c.businessDisposition.toLowerCase().includes('prospect'))) {
        convertedLeads++;
      }
    });

    const unconnectedCalls = totalCalls - connectedCalls;
    const avgCallDuration = connectedCalls > 0 ? Math.round(totalCallTime / connectedCalls) : 0;

    const callOverview = {
      totalCalls,
      connectedCalls,
      totalCallTime,
      unconnectedCalls,
      avgCallDuration
    };

    const outgoingCalls = {
      totalOutgoing: totalCalls,
      connected: connectedCalls,
      unanswered: unconnectedCalls,
      avgDuration: avgCallDuration
    };

    const dispositionReport = {
      totalDispositions,
      connectedDispositions,
      notConnectedDispositions,
      convertedLeads
    };

    // 3. Follow-up Report
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);
    const yestStart = new Date(); yestStart.setDate(todayStart.getDate() - 1); yestStart.setHours(0,0,0,0);
    const yestEnd = new Date(); yestEnd.setDate(todayStart.getDate() - 1); yestEnd.setHours(23,59,59,999);

    const [dueToday, completedToday, missedYesterday] = await Promise.all([
      LeadFollowup.countDocuments({ userId, scheduledAt: { $gte: todayStart, $lte: todayEnd }, status: { $ne: 'Completed' } }),
      LeadFollowup.countDocuments({ userId, updatedAt: { $gte: todayStart, $lte: todayEnd }, status: 'Completed' }),
      LeadFollowup.countDocuments({ userId, scheduledAt: { $gte: yestStart, $lte: yestEnd }, status: { $ne: 'Completed' } })
    ]);

    const compliance = (dueToday + completedToday) > 0 ? Math.round((completedToday / (dueToday + completedToday)) * 100) : 100;
    const followUpReport = {
      dueToday,
      completedToday,
      missedYesterday,
      compliance,
      avgTurnAroundTime: 120
    };

    // 5. Lead Performance
    const [assignedLeads, selfCreatedLeads, contacted, interested, hotLeads, qualified, convertedToProspect] = await Promise.all([
      Lead.countDocuments({ assignedEmployee: userId, isDeleted: { $ne: true } }),
      Lead.countDocuments({ createdBy: userId, isDeleted: { $ne: true } }),
      Lead.countDocuments({ assignedEmployee: userId, firstCalledAt: { $ne: null }, isDeleted: { $ne: true } }),
      Lead.countDocuments({ assignedEmployee: userId, currentStatus: 'Interested', isDeleted: { $ne: true } }),
      Lead.countDocuments({ assignedEmployee: userId, priority: { $in: ['High', 'Urgent'] }, isDeleted: { $ne: true } }),
      Lead.countDocuments({ assignedEmployee: userId, currentStatus: 'Qualified', isDeleted: { $ne: true } }),
      Lead.countDocuments({ assignedEmployee: userId, currentStatus: 'Converted', isDeleted: { $ne: true } })
    ]);

    const leadPerformance = {
      assignedLeads,
      selfCreatedLeads,
      contacted,
      interested,
      hotLeads,
      qualified,
      convertedToProspect
    };

    // 6. Activity Summary
    const sessions = await WorkingSession.find({ userId, date: { $gte: startStr, $lte: endStr } }).lean();
    let totalWorkingSeconds = 0;
    let breakSeconds = 0;
    let breakCount = 0;

    sessions.forEach(s => {
      const d = s.durations || {};
      totalWorkingSeconds += (d.Available || 0) + (d.Calling || 0) + (d.AfterCallWork || 0) + (d.Break || 0) + (d.Meeting || 0);
      breakSeconds += (d.Break || 0) + (d.Lunch || 0);
      if (s.activityHistory && Array.isArray(s.activityHistory)) {
        s.activityHistory.forEach(act => {
          if (act.status === 'Break' || act.status === 'Lunch') breakCount++;
        });
      } else if ((d.Break || 0) > 0) {
        breakCount += Math.max(1, Math.ceil((d.Break || 0) / 900));
      }
    });

    const workHours = totalWorkingSeconds / 3600;
    const callsPerHour = workHours > 0 ? Math.round((totalCalls / workHours) * 10) / 10 : totalCalls;
    const productivityScore = totalWorkingSeconds > 0 ? Math.min(100, Math.round(((totalWorkingSeconds - breakSeconds) / totalWorkingSeconds) * 100)) : 85;

    const activitySummary = {
      totalWorkingHours: Math.round(workHours * 10) / 10,
      totalTalkTime: totalCallTime,
      avgTalkTime: avgCallDuration,
      callsPerHour,
      productivityScore,
      breakCount,
      breakDuration: breakSeconds
    };

    // 7. Message Activity
    const [whatsappSent, smsSent, emailsSent] = await Promise.all([
      LeadActivity.countDocuments({ performedBy: userId, activityType: 'WHATSAPP_SENT', createdAt: { $gte: start, $lte: end } }),
      LeadActivity.countDocuments({ performedBy: userId, activityType: 'SMS_SENT', createdAt: { $gte: start, $lte: end } }),
      LeadActivity.countDocuments({ performedBy: userId, activityType: 'EMAIL_SENT', createdAt: { $gte: start, $lte: end } })
    ]);

    const messageActivity = {
      whatsappSent,
      smsSent,
      emailsSent
    };

    // 8. Login Activity
    const loginSessions = await WorkingSession.find({ userId }).sort({ loginTime: -1 }).limit(10).lean();
    const loginActivity = loginSessions.map(ls => {
      const logIn = ls.loginTime || ls.createdAt;
      const logOut = ls.logoutTime;
      let totalSessSecs = 0;
      if (logOut && logIn) {
        totalSessSecs = Math.floor((new Date(logOut).getTime() - new Date(logIn).getTime()) / 1000);
      } else if (logIn) {
        totalSessSecs = Math.floor((Date.now() - new Date(logIn).getTime()) / 1000);
      }
      return {
        loginTime: logIn,
        logoutTime: logOut || null,
        totalSession: totalSessSecs,
        device: ls.device || 'Web/Mobile App',
        location: ls.location || 'India (HQ)'
      };
    });

    return {
      callOverview,
      outgoingCalls,
      followUpReport,
      dispositionReport,
      leadPerformance,
      activitySummary,
      messageActivity,
      loginActivity
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
