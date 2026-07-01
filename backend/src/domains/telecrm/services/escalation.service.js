const Lead = require('../models/lead.model');
const User = require('../../../domains/users/user.model');
const queueManagementService = require('./queueManagement.service');
const configurationService = require('./configuration.service');

class EscalationService {
  async processEscalations() {
    const cfg = await configurationService.getConfig();
    const inactivityDays = cfg?.slaRules?.inactivityReassignDays || 2;

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - inactivityDays);

    // Find leads assigned to inactive/resigned executives or untouched beyond inactivity threshold
    const stagnantLeads = await Lead.find({
      currentStatus: { $in: ['New', 'Calling'] },
      assignedEmployee: { $ne: null },
      $or: [
        { updatedAt: { $lt: thresholdDate } },
        { slaStatus: 'BREACHED' }
      ]
    });

    let escalatedCount = 0;
    for (const ld of stagnantLeads) {
      // Check if executive is inactive/disabled
      const exec = await User.findById(ld.assignedEmployee).select('isActive isResigned');
      if (!exec || !exec.isActive || exec.isResigned) {
        // Return to pool or reassign to manager
        await queueManagementService.transferOwnership({
          leadIds: [ld._id],
          toUserId: null, // pool
          fromUserId: ld.assignedEmployee,
          reason: 'Auto Reassignment: Executive inactive/resigned'
        });
        escalatedCount++;
      } else if (ld.slaStatus === 'BREACHED') {
        // Notify manager or escalate priority
        ld.priority = 'Urgent';
        await ld.save();
        escalatedCount++;
      }
    }

    return escalatedCount;
  }
}

module.exports = new EscalationService();
