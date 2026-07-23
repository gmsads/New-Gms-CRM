const Lead = require('../models/lead.model');
const LeadCall = require('../models/leadCall.model');
const WorkingSession = require('../models/workingSession.model');
const LeadFollowup = require('../models/leadFollowup.model');
const LeadActivity = require('../models/leadActivity.model');
const Order = require('../../orders/order.model');
const mongoose = require('mongoose');

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
    const connectedRatio = totalCalls > 0 ? Math.round((connectedCalls / totalCalls) * 100) : 0;

    const callOverview = {
      totalCalls,
      answeredCalls: connectedCalls,
      unansweredCalls: unconnectedCalls,
      connectedRatio
    };

    const formatSeconds = (sec) => {
      if (!sec || isNaN(sec) || sec <= 0) return '0s';
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = Math.floor(sec % 60);
      if (h > 0) return `${h}h ${m}m`;
      if (m > 0) return `${m}m ${s}s`;
      return `${s}s`;
    };

    const longestDuration = calls.reduce((max, c) => Math.max(max, c.talkDuration || c.durationSeconds || 0), 0);
    const positiveDurations = calls.map(c => c.talkDuration || c.durationSeconds || 0).filter(d => d > 0);
    const shortestDuration = positiveDurations.length > 0 ? Math.min(...positiveDurations) : 0;

    const outgoingCalls = {
      totalTalkDuration: formatSeconds(totalCallTime),
      avgTalkTime: formatSeconds(avgCallDuration),
      longestCall: formatSeconds(longestDuration),
      shortestCall: formatSeconds(shortestDuration)
    };

    const dispColors = {
      'Connected': 'bg-emerald-500',
      'Busy / Call Waiting': 'bg-amber-500',
      'Not Reachable': 'bg-blue-500',
      'Interested / Demo': 'bg-indigo-500',
      'Quotation Sent': 'bg-purple-500',
      'Not Interested / Lost': 'bg-rose-500'
    };
    const dispMap = { 'Connected': 0, 'Busy / Call Waiting': 0, 'Not Reachable': 0, 'Interested / Demo': 0, 'Quotation Sent': 0, 'Not Interested / Lost': 0 };
    calls.forEach(c => {
      if (c.callStatus === 'Connected') dispMap['Connected']++;
      else if (c.callStatus === 'Busy' || c.callStatus === 'Call Waiting') dispMap['Busy / Call Waiting']++;
      else dispMap['Not Reachable']++;
      if (c.interested || (c.businessDisposition && c.businessDisposition.toLowerCase().includes('interested'))) dispMap['Interested / Demo']++;
      if (c.needQuotation || (c.businessDisposition && c.businessDisposition.toLowerCase().includes('quotation'))) dispMap['Quotation Sent']++;
      if (c.businessDisposition && c.businessDisposition.toLowerCase().includes('not interested')) dispMap['Not Interested / Lost']++;
    });
    const dispositionReport = Object.keys(dispMap).map(label => ({
      label,
      count: dispMap[label],
      color: dispColors[label] || 'bg-primary'
    }));

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

    const followupReport = {
      totalScheduled: dueToday + completedToday,
      completed: completedToday,
      overdue: missedYesterday,
      upcomingToday: dueToday
    };

    // 5. Lead Performance
    const [assignedLeads, selfCreatedLeads, contacted, interestedCount, hotLeads, qualified, convertedToProspect] = await Promise.all([
      Lead.countDocuments({ assignedEmployee: userId, isDeleted: { $ne: true } }),
      Lead.countDocuments({ createdBy: userId, isDeleted: { $ne: true } }),
      Lead.countDocuments({ assignedEmployee: userId, firstCalledAt: { $ne: null }, isDeleted: { $ne: true } }),
      Lead.countDocuments({ assignedEmployee: userId, currentStatus: 'Interested', isDeleted: { $ne: true } }),
      Lead.countDocuments({ assignedEmployee: userId, priority: { $in: ['High', 'Urgent'] }, isDeleted: { $ne: true } }),
      Lead.countDocuments({ assignedEmployee: userId, currentStatus: 'Qualified', isDeleted: { $ne: true } }),
      Lead.countDocuments({ assignedEmployee: userId, currentStatus: 'Converted', isDeleted: { $ne: true } })
    ]);

    const leadPerformance = {
      totalWorked: assignedLeads + selfCreatedLeads,
      touchedToday: contacted,
      convertedToProspect,
      hotLeads
    };

    // 6. Activity Summary
    const sessions = await WorkingSession.find({ userId, date: { $gte: startStr, $lte: endStr } }).lean();
    let totalWorkingSeconds = 0;
    let breakSeconds = 0;
    let breakCount = 0;
    let actualCallWorkSeconds = 0;

    sessions.forEach(s => {
      const d = s.durations || {};
      totalWorkingSeconds += (d.Available || 0) + (d.Calling || 0) + (d.AfterCallWork || 0) + (d.Break || 0) + (d.Meeting || 0);
      actualCallWorkSeconds += (d.Calling || 0) + (d.AfterCallWork || 0) + (d.Meeting || 0);
      breakSeconds += (d.Break || 0) + (d.Lunch || 0);
      if (s.activityHistory && Array.isArray(s.activityHistory)) {
        s.activityHistory.forEach(act => {
          if (act.status === 'Break' || act.status === 'Lunch') breakCount++;
        });
      } else if ((d.Break || 0) > 0) {
        breakCount += Math.max(1, Math.ceil((d.Break || 0) / 900));
      }
    });

    const formatTimeOnly = (dt) => {
      if (!dt) return '--:--';
      const d = new Date(dt);
      if (isNaN(d.getTime())) return '--:--';
      return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const hasRealActivity = calls.length > 0 || actualCallWorkSeconds > 0;

    const firstCallTime = calls.length > 0 ? formatTimeOnly(calls[calls.length - 1].startTime || calls[calls.length - 1].createdAt) : '--:--';
    const lastCallTime = calls.length > 0 ? formatTimeOnly(calls[0].startTime || calls[0].createdAt) : '--:--';

    const activitySummary = {
      firstCallTime,
      lastCallTime,
      totalSessionTime: hasRealActivity ? formatSeconds(totalWorkingSeconds) : '00h 00m',
      acwBreakTime: hasRealActivity ? formatSeconds(breakSeconds) : '00m'
    };

    // 7. Message Activity
    const [whatsappSent, smsSent, emailsSent] = await Promise.all([
      LeadActivity.countDocuments({ performedBy: userId, activityType: 'WHATSAPP_SENT', createdAt: { $gte: start, $lte: end } }),
      LeadActivity.countDocuments({ performedBy: userId, activityType: 'SMS_SENT', createdAt: { $gte: start, $lte: end } }),
      LeadActivity.countDocuments({ performedBy: userId, activityType: 'EMAIL_SENT', createdAt: { $gte: start, $lte: end } })
    ]);

    const messageActivity = {
      whatsappSent,
      emailSent: emailsSent,
      smsSent,
      quotesDispatched: calls.filter(c => c.needQuotation).length
    };

    // 8. Login Activity
    const loginSessions = await WorkingSession.find({ userId }).sort({ loginTime: -1 }).limit(1).lean();
    const latestLogin = loginSessions[0] || {};
    const checkInTime = hasRealActivity && (latestLogin.loginTime || latestLogin.createdAt) ? formatTimeOnly(latestLogin.loginTime || latestLogin.createdAt) : '--:--';
    const checkOutTime = hasRealActivity && latestLogin.logoutTime ? formatTimeOnly(latestLogin.logoutTime) : '--:--';
    
    let activeSecs = 0;
    if (hasRealActivity && latestLogin.loginTime) {
      const endT = latestLogin.logoutTime ? new Date(latestLogin.logoutTime).getTime() : Date.now();
      activeSecs = Math.max(0, Math.floor((endT - new Date(latestLogin.loginTime).getTime()) / 1000));
    }

    const loginActivity = {
      checkInTime,
      checkOutTime,
      activeDuration: hasRealActivity ? formatSeconds(activeSecs) : '00h 00m',
      currentState: latestLogin.currentStatus || latestLogin.status || 'Available'
    };

    return {
      callOverview,
      outgoingCalls,
      followupReport,
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

  async getSimplifiedExecutiveReport(params) {
    const { filter = 'today', startDate, endDate, executiveId, requestorRole, requestorId, page = 1, limit = 50 } = params;

    let start = new Date();
    let end = new Date();

    if (filter === 'yesterday') {
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (filter === 'this_week') {
      const day = start.getDay() || 7;
      start.setDate(start.getDate() - day + 1);
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
    } else { // today
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }

    const isExec = ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC', 'AGENT'].includes(requestorRole);
    const isManagement = !isExec;
    
    // Determine target users
    let targetUserIds = [];
    if (isManagement) {
      if (executiveId && executiveId !== 'all') {
        targetUserIds = [mongoose.Types.ObjectId(executiveId)];
      } else {
        // null targetUserIds means 'all'
        targetUserIds = null;
      }
    } else {
      targetUserIds = [mongoose.Types.ObjectId(requestorId)];
    }

    const matchUser = targetUserIds ? { $in: targetUserIds } : { $exists: true };

    // 1. KPI Calculations
    // Exclude leads created by the executive from the 'Assigned' count to avoid double-counting
    const assignedLeadsPromise = Lead.countDocuments({ assignedEmployee: matchUser, $expr: { $ne: ['$assignedEmployee', '$createdBy'] }, isDeleted: { $ne: true }, createdAt: { $gte: start, $lte: end } });
    // Created leads are those they generated AND kept (assignedEmployee == createdBy)
    const createdLeadsPromise = Lead.countDocuments({ assignedEmployee: matchUser, $expr: { $eq: ['$assignedEmployee', '$createdBy'] }, isDeleted: { $ne: true }, createdAt: { $gte: start, $lte: end } });
    
    // Previous Pending Leads: Leads created before the selected period that are still active or were worked on during this period
    const previousPendingPromise = Lead.countDocuments({
      assignedEmployee: matchUser,
      createdAt: { $lt: start },
      $or: [
        { currentStatus: { $nin: ['Converted', 'Lost', 'Not Interested'] } },
        { updatedAt: { $gte: start, $lte: end } }
      ],
      isDeleted: { $ne: true }
    });
    
    // For calls, we look at LeadCall model
    const callsPromise = LeadCall.find({ callerId: matchUser, createdAt: { $gte: start, $lte: end } }).lean();
    
    const followupsPromise = LeadFollowup.countDocuments({ userId: matchUser, createdAt: { $gte: start, $lte: end } });
    
    // For status-based metrics in this period, we could either track timeline changes or just current status of leads worked in this period.
    // To keep it simple and accurate to operational reporting, we count leads assigned to them that currently hold these statuses.
    const prospectsPromise = Lead.countDocuments({ assignedEmployee: matchUser, currentStatus: 'Converted', isDeleted: { $ne: true } });
    // Let's adjust 'Sales', 'Lost', 'Pending' based on exact lead statuses
    const lostPromise = Lead.countDocuments({ assignedEmployee: matchUser, currentStatus: { $in: ['Lost', 'Not Interested'] }, isDeleted: { $ne: true } });
    const pendingPromise = Lead.countDocuments({ assignedEmployee: matchUser, currentStatus: { $nin: ['Converted', 'Lost', 'Not Interested'] }, isDeleted: { $ne: true } });

    const [assignedLeads, createdLeads, previousPendingLeads, calls, followups, prospects, lost, pending] = await Promise.all([
      assignedLeadsPromise, createdLeadsPromise, previousPendingPromise, callsPromise, followupsPromise, prospectsPromise, lostPromise, pendingPromise
    ]);

    let callsMade = calls.length;
    let connected = 0;
    let totalCallingTime = 0;

    calls.forEach(c => {
      const dur = c.talkDuration || c.durationSeconds || 0;
      if (c.callStatus === 'Connected') {
        connected++;
        totalCallingTime += dur;
      }
    });

    const averageCallDuration = connected > 0 ? Math.round(totalCallingTime / connected) : 0;
    
    // Productivity Formula: min(100, (Calls * 0.5) + (Followups * 2) + (Prospects * 10))
    // A balanced combination based on activity.
    let productivity = Math.min(100, Math.round((callsMade * 0.5) + (followups * 2) + (prospects * 10)));
    // If no assigned leads and no calls, productivity is 0
    if (assignedLeads === 0 && callsMade === 0) productivity = 0;

    const kpis = {
      assignedLeads,
      createdLeads,
      previousPendingLeads,
      totalLeads: assignedLeads + createdLeads + previousPendingLeads,
      callsMade,
      connected,
      followups,
      prospects,
      sales: prospects, // In this CRM, Prospect often converts to Sale order later. We report prospects here.
      lost,
      pending,
      totalCallingTime,
      averageCallDuration,
      productivity
    };

    if (isManagement) {
      const orders = await Order.find({
        salesExec: matchUser,
        verificationStatus: 'Verified',
        createdAt: { $gte: start, $lte: end },
        isDeleted: { $ne: true }
      }).lean();
      
      const revenueGenerated = orders.reduce((sum, order) => sum + (order.grandTotal || 0), 0);
      kpis.revenueGenerated = revenueGenerated;
      // Use verified orders for 'sales' KPI if appropriate, or keep prospects as sales
      kpis.sales = orders.length; 
    }

    // 2. Call Activity Report Data (Paginated)
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Use aggregation to paginate Call Activities efficiently
    const callActivitiesAggregation = [
      { $match: { callerId: matchUser, createdAt: { $gte: start, $lte: end } } },
      { $sort: { callStartTime: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'leads',
          localField: 'leadId',
          foreignField: '_id',
          as: 'leadInfo'
        }
      },
      { $unwind: { path: '$leadInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          executiveName: { $ifNull: ['$callerName', 'Unknown'] },
          businessName: { $ifNull: ['$companyName', { $ifNull: ['$leadInfo.companyName', 'N/A'] }] },
          clientName: { $ifNull: ['$leadInfo.contactPerson', 'N/A'] },
          mobileNumber: { $ifNull: ['$calleePhone', { $ifNull: ['$leadInfo.phone', 'N/A'] }] },
          callStartTime: { $ifNull: ['$callStartTime', '$createdAt'] },
          callEndTime: { $ifNull: ['$endTime', '$createdAt'] },
          duration: { $ifNull: ['$durationSeconds', { $ifNull: ['$talkDuration', 0] }] },
          disposition: { $ifNull: ['$businessDisposition', { $ifNull: ['$callStatus', 'Unknown'] }] },
          remarks: { $ifNull: ['$remarks', ''] }
        }
      }
    ];

    const callActivities = await LeadCall.aggregate(callActivitiesAggregation);
    const totalActivities = callsMade; // We already have the total count

    return {
      success: true,
      data: {
        kpis,
        callActivities,
        pagination: {
          total: totalActivities,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(totalActivities / limitNum)
        }
      }
    };
  }
}

module.exports = new AnalyticsService();
