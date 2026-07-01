const Lead = require('../models/lead.model');
const auditService = require('./audit.service');

class QueueManagementService {
  async categorizeLead(leadId, disposition, status, nextFollowupDate) {
    const lead = await Lead.findById(leadId);
    if (!lead) return null;

    let queue = 'Today';
    const disp = (disposition || status || '').toLowerCase();

    if (disp.includes('meeting')) {
      queue = 'Meeting';
    } else if (disp.includes('highly interested') || disp.includes('hot') || disp.includes('quotation')) {
      queue = 'Hot Leads';
    } else if (disp.includes('wrong number') || disp.includes('invalid')) {
      queue = 'Manager Review';
    } else if (disp.includes('lost') || disp.includes('not interested')) {
      queue = 'Lost';
    } else if (disp.includes('busy') || disp.includes('no answer') || disp.includes('switched off') || disp.includes('failed')) {
      queue = 'Tomorrow'; // Tomorrow Call Queue
    } else if (nextFollowupDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      const fDateStr = new Date(nextFollowupDate).toISOString().split('T')[0];
      if (fDateStr > todayStr) {
        queue = 'Follow-up';
      } else {
        queue = 'Today';
      }
    } else if (lead.currentStatus === 'New') {
      queue = 'New';
    }

    lead.queueCategory = queue;
    await lead.save();
    return queue;
  }

  async lockLead(leadId, userId) {
    const now = new Date();
    const lockExpiry = new Date(now.getTime() + 15 * 60000); // 15 min lock

    const lead = await Lead.findById(leadId);
    if (!lead) throw new Error('Lead not found');

    if (lead.lockedBy && lead.lockedBy.toString() !== userId.toString() && lead.lockedUntil > now) {
      throw new Error('Lead is currently locked by another executive calling it');
    }

    lead.lockedBy = userId;
    lead.lockedUntil = lockExpiry;
    await lead.save();
    return true;
  }

  async unlockLead(leadId, userId) {
    await Lead.updateOne(
      { _id: leadId, lockedBy: userId },
      { $set: { lockedBy: null, lockedUntil: null } }
    );
    return true;
  }

  async transferOwnership({ leadIds, toUserId, fromUserId, reason = 'Manager Reassignment', user }) {
    for (const lid of leadIds) {
      await Lead.findByIdAndUpdate(lid, {
        $set: { assignedEmployee: toUserId, assignedDate: new Date() },
        $push: {
          transferHistory: {
            fromUser: fromUserId,
            toUser: toUserId,
            transferredAt: new Date(),
            reason
          }
        }
      });
    }

    await auditService.log({
      userId: user?._id || fromUserId,
      userName: user?.name || 'System',
      action: 'LEAD_TRANSFER',
      newValue: { leadIds, toUserId, reason }
    });
  }
}

module.exports = new QueueManagementService();
