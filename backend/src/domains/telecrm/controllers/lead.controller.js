const LeadService = require('../services/lead.service');
const DistributionService = require('../services/distribution.service');
const TelephonyService = require('../services/telephony.service');
const Lead = require('../models/lead.model');
const LeadCall = require('../models/leadCall.model');
const LeadFollowup = require('../models/leadFollowup.model');
const TeleCampaign = require('../models/teleCampaign.model');
const CampaignRule = require('../models/campaignRule.model');
const { getAccessibleUserIds } = require('../../../utils/team.helper');

/**
 * LeadController
 * Handles Express requests for Enterprise Lead Management.
 */
class LeadController {
  // GET /api/telecrm/leads
  async getLeads(req, res, next) {
    try {
      const { status, priority, campaign, source, tab, page = 1, limit = 20, sort, search } = req.query;
      const filter = {};

      if (status) filter.currentStatus = status;
      if (priority) filter.priority = priority;
      if (campaign) filter.campaign = campaign;
      if (source) filter.source = source;

      // Strict Scoping for Executive Roles ("My Leads Desk")
      const isExec = ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC'].includes(req.user.role);
      const ownerMode = req.query.ownerFilter || tab;
      if (isExec) {
        if (ownerMode === 'assigned') {
          filter.assignedEmployee = req.user._id;
        } else if (ownerMode === 'created') {
          filter.createdBy = req.user._id;
        } else {
          filter.$or = [
            { assignedEmployee: req.user._id },
            { createdBy: req.user._id }
          ];
        }
      } else {
        // Management & Admin Scoping (Includes unassigned pool leads)
        const accessibleIds = await getAccessibleUserIds(req.user);
        if (accessibleIds && accessibleIds.length > 0) {
          if (ownerMode === 'assigned') {
            filter.assignedEmployee = req.user._id;
          } else if (ownerMode === 'created') {
            filter.createdBy = req.user._id;
          } else {
            filter.$or = [
              { assignedEmployee: { $in: accessibleIds } },
              { assignedEmployee: null },
              { assignedEmployee: { $exists: false } },
              { createdBy: req.user._id }
            ];
          }
        } else {
          if (ownerMode === 'assigned') filter.assignedEmployee = req.user._id;
          if (ownerMode === 'created') filter.createdBy = req.user._id;
        }
      }

      // Status / Workflow Tab filtering
      if (tab === 'new') filter.currentStatus = 'New';
      if (tab === 'interested') filter.currentStatus = 'Interested';
      if (tab === 'hot') filter.priority = { $in: ['High', 'Urgent'] };
      if (tab === 'completed') filter.currentStatus = { $in: ['Converted', 'Lost', 'Not Interested'] };
      if (tab === 'today') {
        const start = new Date(); start.setHours(0,0,0,0);
        const end = new Date(); end.setHours(23,59,59,999);
        filter.assignedDate = { $gte: start, $lte: end };
      }
      if (tab === 'followup') {
        filter.lastFollowUpDate = { $ne: null };
        filter.currentStatus = { $nin: ['Converted', 'Lost'] };
      }

      const result = await LeadService.listLeads({ filter, page, limit, search });
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/telecrm/dashboard (Admin KPI dashboard)
  async getDashboardStats(req, res, next) {
    try {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

      const [
        totalLeads, todayLeads, todayCalls, connectedCalls, busyCalls, 
        notConnectedCalls, interestedLeads, qualifiedLeads, convertedLeads, hotLeads
      ] = await Promise.all([
        Lead.countDocuments({ isDeleted: { $ne: true } }),
        Lead.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd }, isDeleted: { $ne: true } }),
        LeadCall.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd } }),
        LeadCall.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd }, callStatus: 'Connected' }),
        LeadCall.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd }, callStatus: 'Busy' }),
        LeadCall.countDocuments({ createdAt: { $gte: todayStart, $lte: todayEnd }, callStatus: { $ne: 'Connected' } }),
        Lead.countDocuments({ currentStatus: 'Interested', isDeleted: { $ne: true } }),
        Lead.countDocuments({ currentStatus: 'Qualified', isDeleted: { $ne: true } }),
        Lead.countDocuments({ currentStatus: 'Converted', isDeleted: { $ne: true } }),
        Lead.countDocuments({ priority: { $in: ['High', 'Urgent'] }, currentStatus: { $nin: ['Converted', 'Lost'] }, isDeleted: { $ne: true } })
      ]);

      // Top executive leaderboard
      const topExecs = await LeadCall.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd }, callStatus: 'Connected' } },
        { $group: { _id: '$callerId', callerName: { $first: '$callerName' }, callsCount: { $sum: 1 }, talkTimeSeconds: { $sum: '$durationSeconds' } } },
        { $sort: { callsCount: -1 } },
        { $limit: 5 }
      ]);

      res.json({
        success: true,
        stats: {
          totalLeads, todayLeads, todayCalls, connectedCalls, busyCalls, 
          notConnectedCalls, interestedLeads, qualifiedLeads, convertedLeads, hotLeads
        },
        topExecs
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/telecrm/leads
  async createManualLead(req, res, next) {
    try {
      const lead = await LeadService.createLead(req.body, req.user);
      res.status(201).json({ success: true, data: lead });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/telecrm/import/preview
  async previewImport(req, res, next) {
    try {
      const { rows } = req.body;
      if (!rows || !Array.isArray(rows)) {
        return res.status(400).json({ success: false, message: 'Invalid payload: rows array required.' });
      }
      const preview = await LeadService.previewBulkImport(rows);
      res.json({ success: true, data: preview });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/telecrm/import/commit
  async commitImport(req, res, next) {
    try {
      const { validRows, duplicateRows, resolution, distributionMethod, singleUserId, employeeNameMap, campaignId } = req.body;
      
      const commitRes = await LeadService.commitBulkImport({
        validRows,
        duplicateRows,
        resolution,
        campaignId,
        actor: req.user
      });

      // Distribute committed records
      const distRes = await DistributionService.distributeImportedLeads({
        leadIds: commitRes.leadIds,
        method: distributionMethod || 'Round Robin',
        singleUserId,
        employeeNameMap,
        actorId: req.user._id
      });

      res.json({
        success: true,
        importSummary: commitRes,
        distributionSummary: distRes
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/telecrm/on-demand
  async assignOnDemand(req, res, next) {
    try {
      const { batchSize = 10, campaignId } = req.body;
      const result = await DistributionService.assignOnDemandBatch({
        userId: req.user._id,
        batchSize,
        campaignId
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/telecrm/calls/initiate
  async initiateCall(req, res, next) {
    try {
      const { calleePhone, leadId } = req.body;
      const callRes = await TelephonyService.initiateCall({
        callerPhone: req.user.phone || '9999999999',
        calleePhone,
        leadId,
        callerId: req.user._id
      });

      await Lead.updateOne(
        { _id: leadId },
        { $set: { currentStatus: 'Calling' } }
      );

      res.json({ success: true, data: callRes });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/telecrm/calls/popup (After Call Disposition Popup)
  async saveCallDisposition(req, res, next) {
    try {
      const { leadId, callStatus, durationSeconds, remarks, followupDate, followupTime, interested, needMeeting, needQuotation, convertToProspect } = req.body;

      const lead = await Lead.findById(leadId);
      if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

      // Ownership check for Executives
      const isExec = ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC'].includes(req.user.role);
      if (isExec && lead.assignedEmployee?.toString() !== req.user._id.toString() && lead.createdBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Access denied: You do not own this lead record.' });
      }

      // 1. Create Call Log
      await LeadCall.create({
        leadId,
        callerId: req.user._id,
        callerName: req.user.name,
        calleePhone: lead.phone,
        companyName: lead.companyName,
        callStatus: callStatus || 'Connected',
        durationSeconds: durationSeconds || 30,
        remarks,
        interested,
        needMeeting,
        needQuotation,
        convertedToProspect: convertToProspect || false
      });

      // 2. Schedule Followup if date provided
      if (followupDate) {
        const schedDate = new Date(`${followupDate}T${followupTime || '10:00'}:00`);
        await LeadFollowup.create({
          leadId,
          userId: req.user._id,
          userName: req.user.name,
          followupDate,
          followupTime: followupTime || '10:00',
          scheduledAt: schedDate,
          remarks: remarks || 'Scheduled followup after call'
        });
        lead.lastFollowUpDate = schedDate;

        try {
          const NotificationWorkflowService = require('../../../services/workflows/notificationWorkflow.service');
          const nw = new NotificationWorkflowService();
          await nw.sendNotification({
            recipient: req.user._id,
            sender: req.user._id,
            type: 'LEAD',
            title: 'Follow-up Scheduled',
            message: `Follow-up for ${lead.companyName || lead.contactPerson} scheduled on ${followupDate} at ${followupTime || '10:00'}`,
            link: '/telecrm/my-leads'
          });
        } catch (e) {
          console.error('[Notification] Error emitting followup alert:', e.message);
        }
      }

      // 3. Update Lead Status
      lead.lastRemark = remarks;
      if (interested) lead.currentStatus = 'Interested';
      if (callStatus === 'Busy') lead.currentStatus = 'Busy';
      if (callStatus === 'Not Reachable') lead.currentStatus = 'Not Reachable';
      if (callStatus === 'Rejected') lead.currentStatus = 'Not Interested';

      lead.timeline.push({
        type: 'CALL',
        title: `Call Ended: ${callStatus || 'Connected'}`,
        description: remarks,
        performedBy: req.user._id,
        performedByName: req.user.name
      });
      await lead.save();

      // 4. Trigger conversion bridge if requested
      if (convertToProspect) {
        await LeadService.convertToProspect(leadId, req.user);
      }

      res.json({ success: true, message: 'Call disposition saved successfully.' });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/telecrm/calls/history
  async getCallHistory(req, res, next) {
    try {
      const { employee, campaign, status, page = 1, limit = 25 } = req.query;
      const query = {};

      if (employee) query.callerId = employee;
      if (status) query.callStatus = status;

      const accessibleIds = await getAccessibleUserIds(req.user);
      if (accessibleIds && !employee) {
        query.callerId = { $in: accessibleIds };
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const [calls, total] = await Promise.all([
        LeadCall.find(query)
          .populate('leadId', 'contactPerson companyName leadNumber')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10))
          .lean(),
        LeadCall.countDocuments(query)
      ]);

      res.json({
        success: true,
        calls,
        pagination: { total, page: parseInt(page, 10), limit: parseInt(limit, 10), pages: Math.ceil(total / parseInt(limit, 10)) }
      });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/telecrm/leads/:id/convert
  async convertLead(req, res, next) {
    try {
      const result = await LeadService.convertToProspect(req.params.id, req.user);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/telecrm/reports/:type
  async getReports(req, res, next) {
    try {
      const { type } = req.params;
      const accessibleIds = await getAccessibleUserIds(req.user);
      const matchScope = accessibleIds ? { callerId: { $in: accessibleIds.map(id => require('mongoose').Types.ObjectId(id)) } } : {};

      if (type === 'source') {
        const data = await Lead.aggregate([
          { $match: { isDeleted: { $ne: true } } },
          { $group: { _id: '$source', count: { $sum: 1 }, converted: { $sum: { $cond: [{ $eq: ['$currentStatus', 'Converted'] }, 1, 0] } } } }
        ]);
        return res.json({ success: true, data });
      }

      if (type === 'performance') {
        const data = await LeadCall.aggregate([
          { $match: matchScope },
          { $group: { _id: '$callerId', callerName: { $first: '$callerName' }, totalCalls: { $sum: 1 }, connected: { $sum: { $cond: [{ $eq: ['$callStatus', 'Connected'] }, 1, 0] } }, avgTalkTime: { $avg: '$durationSeconds' } } }
        ]);
        return res.json({ success: true, data });
      }

      res.json({ success: true, data: [] });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/telecrm/campaigns
  async createCampaign(req, res, next) {
    try {
      const mongoose = require('mongoose');
      const cleanArr = arr => (Array.isArray(arr) ? arr.filter(id => id && mongoose.isValidObjectId(id)) : []);
      const primaryMgr = req.body.campaignManager || (Array.isArray(req.body.managers) && req.body.managers[0]) || req.user._id;
      const campaign = await TeleCampaign.create({
        ...req.body,
        campaignManager: mongoose.isValidObjectId(primaryMgr) ? primaryMgr : req.user._id,
        managers: cleanArr(req.body.managers).length > 0 ? cleanArr(req.body.managers) : [req.user._id],
        agents: cleanArr(req.body.agents),
        createdBy: req.user._id
      });
      res.status(201).json({ success: true, data: campaign });
    } catch (err) {
      next(err);
    }
  }

  // GET /api/telecrm/campaigns
  async listCampaigns(req, res, next) {
    try {
      const campaigns = await TeleCampaign.find({ isDeleted: { $ne: true } })
        .populate('campaignManager', 'name')
        .populate('agents', 'name')
        .sort({ createdAt: -1 })
        .lean();
      res.json({ success: true, data: campaigns });
    } catch (err) {
      next(err);
    }
  }

  // POST /api/telecrm/campaigns/:id/rules
  async saveCampaignRules(req, res, next) {
    try {
      const { id } = req.params;
      const { rules } = req.body;
      if (!rules || !Array.isArray(rules)) {
        return res.status(400).json({ success: false, message: 'Invalid payload: rules array required.' });
      }

      await CampaignRule.deleteMany({ campaignId: id });
      const docs = rules.map((r, idx) => ({
        ...r,
        campaignId: id,
        ruleOrder: idx
      }));
      await CampaignRule.insertMany(docs);

      res.json({ success: true, message: 'AST routing rules saved successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LeadController();
