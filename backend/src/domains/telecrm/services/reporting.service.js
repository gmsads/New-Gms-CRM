const LeadCall = require('../models/leadCall.model');
const Lead = require('../models/lead.model');
const WorkingSession = require('../models/workingSession.model');

class ReportingService {
  async generateEodReport(dateStr) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const startOfDay = new Date(targetDate + 'T00:00:00.000Z');
    const endOfDay = new Date(targetDate + 'T23:59:59.999Z');

    const sessions = await WorkingSession.find({ date: targetDate }).lean();
    const calls = await LeadCall.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } }).lean();

    const executiveMap = {};

    sessions.forEach(s => {
      executiveMap[s.userId.toString()] = {
        executiveId: s.userId,
        executiveName: s.userName,
        assignedLeads: 0,
        callsAttempted: 0,
        connected: 0,
        busy: 0,
        noAnswer: 0,
        wrongNumber: 0,
        interested: 0,
        meetings: 0,
        converted: 0,
        totalTalkTime: 0,
        workingHours: ((s.durations.Calling || 0) + (s.durations.Available || 0)) / 3600,
        idleHours: (s.durations.Idle || 0) / 3600
      };
    });

    calls.forEach(c => {
      const uid = c.callerId.toString();
      if (!executiveMap[uid]) {
        executiveMap[uid] = {
          executiveId: c.callerId,
          executiveName: c.callerName || 'Executive',
          assignedLeads: 0,
          callsAttempted: 0,
          connected: 0,
          busy: 0,
          noAnswer: 0,
          wrongNumber: 0,
          interested: 0,
          meetings: 0,
          converted: 0,
          totalTalkTime: 0,
          workingHours: 0,
          idleHours: 0
        };
      }

      const entry = executiveMap[uid];
      entry.callsAttempted++;
      if (c.callStatus === 'Connected') {
        entry.connected++;
        entry.totalTalkTime += (c.talkDuration || c.durationSeconds || 0);
      } else if (c.callStatus === 'Busy') entry.busy++;
      else if (c.callStatus === 'No Answer') entry.noAnswer++;
      else if (c.callStatus === 'Wrong Number') entry.wrongNumber++;

      if (c.interested) entry.interested++;
      if (c.needMeeting) entry.meetings++;
      if (c.convertedToProspect) entry.converted++;
    });

    const reportRows = Object.values(executiveMap).map(r => ({
      ...r,
      averageCallDuration: r.connected > 0 ? Math.round(r.totalTalkTime / r.connected) : 0,
      workingHours: Number(r.workingHours.toFixed(1)),
      idleHours: Number(r.idleHours.toFixed(1))
    }));

    return {
      date: targetDate,
      totalExecutives: reportRows.length,
      data: reportRows
    };
  }

  generateCsv(rows) {
    if (!rows || !rows.length) return 'No data available';
    const headers = ['Executive Name', 'Calls Attempted', 'Connected', 'Busy', 'No Answer', 'Interested', 'Meetings', 'Converted', 'Total Talk Time (s)', 'Avg Duration (s)', 'Working Hours', 'Idle Hours'];
    const csvRows = [headers.join(',')];

    rows.forEach(r => {
      csvRows.push([
        `"${r.executiveName || ''}"`,
        r.callsAttempted,
        r.connected,
        r.busy,
        r.noAnswer,
        r.interested,
        r.meetings,
        r.converted,
        r.totalTalkTime,
        r.averageCallDuration,
        r.workingHours,
        r.idleHours
      ].join(','));
    });

    return csvRows.join('\n');
  }
}

module.exports = new ReportingService();
