const mongoose = require('mongoose');
const Lead = require('../models/lead.model');
const LeadCall = require('../models/leadCall.model');
const LeadActivity = require('../models/leadActivity.model');
const User = require('../../../users/user.model');

class TelecrmDashboardService {
  buildDateFilter(filters) {
    const { year, month, fromDate, toDate, presetDate } = filters;
    let start = null;
    let end = null;
    const now = new Date();

    if (fromDate && toDate) {
      start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
    } else if (presetDate) {
      switch (presetDate) {
        case 'Today':
          start = new Date(); start.setHours(0,0,0,0);
          end = new Date(); end.setHours(23,59,59,999);
          break;
        case 'Yesterday':
          start = new Date(); start.setDate(start.getDate() - 1); start.setHours(0,0,0,0);
          end = new Date(); end.setDate(end.getDate() - 1); end.setHours(23,59,59,999);
          break;
        case 'Last 7 Days':
          start = new Date(); start.setDate(start.getDate() - 7); start.setHours(0,0,0,0);
          end = new Date(); end.setHours(23,59,59,999);
          break;
        case 'Last 30 Days':
          start = new Date(); start.setDate(start.getDate() - 30); start.setHours(0,0,0,0);
          end = new Date(); end.setHours(23,59,59,999);
          break;
        case 'This Month':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'Last Month':
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
      }
    } else if (year) {
      const y = parseInt(year, 10);
      if (month) {
        const mMap = { 'January':0, 'February':1, 'March':2, 'April':3, 'May':4, 'June':5, 'July':6, 'August':7, 'September':8, 'October':9, 'November':10, 'December':11 };
        const m = mMap[month];
        if (m !== undefined) {
          start = new Date(y, m, 1);
          end = new Date(y, m + 1, 0, 23, 59, 59, 999);
        }
      } else {
        start = new Date(y, 0, 1);
        end = new Date(y, 11, 31, 23, 59, 59, 999);
      }
    }

    if (!start || !end) {
      // Default to This Month if nothing else is provided
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
    
    return { $gte: start, $lte: end };
  }

  buildLeadMatch(filters) {
    const match = { isDeleted: { $ne: true } };
    const dateFilter = this.buildDateFilter(filters);
    match.createdAt = dateFilter;

    if (filters.branch) match.branch = filters.branch;
    if (filters.executive) match.assignedEmployee = mongoose.Types.ObjectId(filters.executive);
    if (filters.source) match.source = filters.source;
    if (filters.status) match.currentStatus = filters.status;
    if (filters.campaign) match.campaign = mongoose.Types.ObjectId(filters.campaign);
    if (filters.priority) match.priority = filters.priority;

    return match;
  }

  buildCallMatch(filters) {
    const match = {};
    const dateFilter = this.buildDateFilter(filters);
    match.createdAt = dateFilter;

    if (filters.executive) match.callerId = mongoose.Types.ObjectId(filters.executive);
    return match;
  }

  async getKpis(filters, userContext) {
    const leadMatch = this.buildLeadMatch(filters);
    const callMatch = this.buildCallMatch(filters);

    const [leads, calls] = await Promise.all([
      Lead.aggregate([
        { $match: leadMatch },
        { $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            created: { $sum: { $cond: [{ $eq: ["$assignedEmployee", null] }, 1, 0] } },
            assigned: { $sum: { $cond: [{ $ne: ["$assignedEmployee", null] }, 1, 0] } },
            interested: { $sum: { $cond: [{ $eq: ["$currentStatus", "Interested"] }, 1, 0] } },
            prospects: { $sum: { $cond: [{ $eq: ["$currentStatus", "Qualified"] }, 1, 0] } },
            sales: { $sum: { $cond: [{ $eq: ["$currentStatus", "Converted"] }, 1, 0] } },
            lost: { $sum: { $cond: [{ $in: ["$currentStatus", ["Not Interested", "Lost"]] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $in: ["$currentStatus", ["New", "Calling"]] }, 1, 0] } },
            remarksUpdated: { $sum: { $cond: [{ $ne: ["$lastRemark", null] }, 1, 0] } }
        }}
      ]),
      LeadCall.aggregate([
        { $match: callMatch },
        { $group: {
            _id: null,
            called: { $sum: 1 },
            connected: { $sum: { $cond: [{ $eq: ["$callStatus", "Connected"] }, 1, 0] } },
            totalCallTime: { $sum: { $ifNull: ["$durationSeconds", "$talkDuration", 0] } },
            followups: { $sum: { $cond: [{ $eq: ["$interested", true] }, 1, 0] } }
        }}
      ])
    ]);

    const leadData = leads[0] || { totalLeads: 0, created: 0, assigned: 0, interested: 0, prospects: 0, sales: 0, lost: 0, pending: 0, remarksUpdated: 0 };
    const callData = calls[0] || { called: 0, connected: 0, totalCallTime: 0, followups: 0 };

    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayMatch = { ...callMatch, createdAt: { $gte: todayStart } };
    const todayCallsAgg = await LeadCall.aggregate([{ $match: todayMatch }, { $count: "count" }]);
    const todaysCalls = todayCallsAgg[0] ? todayCallsAgg[0].count : 0;

    const conversionPercent = leadData.assigned > 0 ? ((leadData.sales / leadData.assigned) * 100).toFixed(2) : 0;
    const avgCallTime = callData.connected > 0 ? (callData.totalCallTime / callData.connected).toFixed(0) : 0;

    return {
      createdLeads: leadData.created,
      assignedLeads: leadData.assigned,
      totalLeads: leadData.totalLeads,
      called: callData.called,
      connected: callData.connected,
      interested: leadData.interested,
      followups: callData.followups,
      prospects: leadData.prospects,
      sales: leadData.sales,
      lost: leadData.lost,
      pending: leadData.pending,
      todaysCalls,
      totalCallTime: callData.totalCallTime,
      averageCallTime: avgCallTime,
      remarksUpdated: leadData.remarksUpdated,
      conversionPercent: parseFloat(conversionPercent),
      verifiedRevenue: 0
    };
  }

  async getExecutivePerformance(filters) {
    const dateFilter = this.buildDateFilter(filters);
    
    const pipeline = [
      { $match: { createdAt: dateFilter, callerId: { $ne: null } } },
      { $group: {
          _id: "$callerId",
          callsMade: { $sum: 1 },
          connected: { $sum: { $cond: [{ $eq: ["$callStatus", "Connected"] }, 1, 0] } },
          totalCallTime: { $sum: { $ifNull: ["$durationSeconds", "$talkDuration", 0] } },
          lastActivity: { $max: "$createdAt" }
      }}
    ];

    const callsByExec = await LeadCall.aggregate(pipeline);
    
    const leadPipeline = [
      { $match: { createdAt: dateFilter, isDeleted: { $ne: true }, assignedEmployee: { $ne: null } } },
      { $group: {
          _id: "$assignedEmployee",
          assignedLeads: { $sum: 1 },
          interested: { $sum: { $cond: [{ $eq: ["$currentStatus", "Interested"] }, 1, 0] } },
          prospects: { $sum: { $cond: [{ $eq: ["$currentStatus", "Qualified"] }, 1, 0] } },
          sales: { $sum: { $cond: [{ $eq: ["$currentStatus", "Converted"] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $in: ["$currentStatus", ["Not Interested", "Lost"]] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ["$currentStatus", ["New", "Calling"]] }, 1, 0] } },
          remarksUpdated: { $sum: { $cond: [{ $ne: ["$lastRemark", null] }, 1, 0] } }
      }}
    ];
    const leadsByExec = await Lead.aggregate(leadPipeline);
    const leadMap = {};
    leadsByExec.forEach(l => {
      if (l._id) leadMap[l._id.toString()] = l;
    });
    
    // Retrieve all active sales execs
    const activeExecs = await User.find({ role: { $in: ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC'] } }).lean();
    
    const result = activeExecs.map(exec => {
      const execCall = callsByExec.find(c => c._id && c._id.toString() === exec._id.toString()) || { callsMade: 0, connected: 0, totalCallTime: 0, lastActivity: null };
      const execLead = leadMap[exec._id.toString()] || { assignedLeads: 0, interested: 0, prospects: 0, sales: 0, lost: 0, pending: 0, remarksUpdated: 0 };
      
      const avg = execCall.connected > 0 ? (execCall.totalCallTime / execCall.connected).toFixed(0) : 0;
      const conv = execLead.assignedLeads > 0 ? ((execLead.sales || 0) / execLead.assignedLeads * 100).toFixed(2) : 0;
      
      return {
        id: exec._id,
        employee: exec.name,
        createdLeads: 0, 
        assignedLeads: execLead.assignedLeads,
        callsMade: execCall.callsMade,
        connected: execCall.connected,
        interested: execLead.interested,
        prospects: execLead.prospects,
        sales: execLead.sales,
        lost: execLead.lost,
        pending: execLead.pending,
        totalCallTime: execCall.totalCallTime,
        averageCallTime: avg,
        remarksUpdated: execLead.remarksUpdated,
        conversionPercent: parseFloat(conv),
        lastActivity: execCall.lastActivity
      };
    });

    // Only return ones that have some data
    return result.filter(r => r.assignedLeads > 0 || r.callsMade > 0).sort((a,b) => b.sales - a.sales || b.callsMade - a.callsMade);
  }

  async getCharts(filters) {
    const leadMatch = this.buildLeadMatch(filters);
    
    // Status Distribution
    const statusAgg = await Lead.aggregate([
      { $match: leadMatch },
      { $group: { _id: "$currentStatus", count: { $sum: 1 } } }
    ]);
    const statusDistribution = statusAgg.map(s => ({ name: s._id || 'Unknown', value: s.count }));

    // Conversion Funnel
    const funnelAgg = await Lead.aggregate([
      { $match: leadMatch },
      { $group: {
          _id: null,
          created: { $sum: 1 },
          assigned: { $sum: { $cond: [{ $ne: ["$assignedEmployee", null] }, 1, 0] } },
          called: { $sum: { $cond: [{ $ne: ["$firstCalledAt", null] }, 1, 0] } },
          interested: { $sum: { $cond: [{ $eq: ["$currentStatus", "Interested"] }, 1, 0] } },
          prospects: { $sum: { $cond: [{ $eq: ["$currentStatus", "Qualified"] }, 1, 0] } },
          sales: { $sum: { $cond: [{ $eq: ["$currentStatus", "Converted"] }, 1, 0] } }
      }}
    ]);
    const f = funnelAgg[0] || { created:0, assigned:0, called:0, interested:0, prospects:0, sales:0 };
    const conversionFunnel = [
      { stage: 'Created', count: f.created },
      { stage: 'Assigned', count: f.assigned },
      { stage: 'Called', count: f.called },
      { stage: 'Interested', count: f.interested },
      { stage: 'Prospect', count: f.prospects },
      { stage: 'Sales', count: f.sales }
    ];

    // Calls Trend (Daily)
    const callsMatch = this.buildCallMatch(filters);
    const callsTrendAgg = await LeadCall.aggregate([
      { $match: callsMatch },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          calls: { $sum: 1 },
          connected: { $sum: { $cond: [{ $eq: ["$callStatus", "Connected"] }, 1, 0] } }
      }},
      { $sort: { _id: 1 } }
    ]);
    const callsTrend = callsTrendAgg.map(c => ({ date: c._id, calls: c.calls, connected: c.connected }));

    return {
      statusDistribution,
      conversionFunnel,
      callsTrend
    };
  }

  async getSourceAnalysis(filters) {
    const leadMatch = this.buildLeadMatch(filters);
    const sourceAgg = await Lead.aggregate([
      { $match: leadMatch },
      { $group: {
          _id: "$source",
          leads: { $sum: 1 },
          prospects: { $sum: { $cond: [{ $eq: ["$currentStatus", "Qualified"] }, 1, 0] } },
          sales: { $sum: { $cond: [{ $eq: ["$currentStatus", "Converted"] }, 1, 0] } }
      }}
    ]);

    return sourceAgg.map(s => {
      const conv = s.leads > 0 ? ((s.sales / s.leads) * 100).toFixed(2) : 0;
      return {
        source: s._id || 'Unknown',
        leads: s.leads,
        prospects: s.prospects,
        sales: s.sales,
        conversionPercent: parseFloat(conv)
      };
    }).sort((a,b) => b.leads - a.leads);
  }

  async getTimeline(filters, limit = 20) {
    const match = this.buildLeadMatch(filters);
    const recentLeads = await Lead.find(match)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .populate('assignedEmployee', 'name')
      .populate('createdBy', 'name')
      .lean();
    
    const timeline = [];
    recentLeads.forEach(l => {
      // Create an event for the latest change
      let type = 'Updated';
      if (l.currentStatus === 'Converted') type = 'Sale';
      else if (l.currentStatus === 'New' && l.createdAt === l.updatedAt) type = 'Created';
      else if (l.currentStatus === 'Interested') type = 'Interested';
      else if (l.currentStatus === 'Qualified') type = 'Prospect';

      timeline.push({
        id: l._id,
        title: `Lead ${type} - ${l.companyName || l.contactPerson}`,
        description: `Status: ${l.currentStatus} | Exec: ${l.assignedEmployee ? l.assignedEmployee.name : 'Unassigned'}`,
        timestamp: l.updatedAt,
        type
      });
    });

    return timeline;
  }
}

module.exports = new TelecrmDashboardService();
