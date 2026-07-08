const Lead = require('../models/lead.model');
const configurationService = require('./configuration.service');

class SlaManagementService {
  async evaluateLeadAgingAndSla(lead) {
    const now = new Date();
    const created = new Date(lead.createdAt || now);
    const assigned = lead.assignedDate ? new Date(lead.assignedDate) : null;

    // Calculate Aging Bucket
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    lead.agingDays = diffDays;

    if (diffDays === 0) lead.agingBucket = 'Today';
    else if (diffDays === 1) lead.agingBucket = '1 Day';
    else if (diffDays === 2) lead.agingBucket = '2 Days';
    else if (diffDays === 3) lead.agingBucket = '3 Days';
    else if (diffDays >= 4 && diffDays <= 7) lead.agingBucket = '4-7 Days';
    else if (diffDays >= 8 && diffDays <= 15) lead.agingBucket = '8-15 Days';
    else lead.agingBucket = '15+ Days';

    // Calculate SLA Status
    if (assigned && !lead.firstCalledAt) {
      const cfg = await configurationService.getConfig();
      const slaRules = cfg?.slaRules || {};
      const firstCallLimit = slaRules.firstCallMaxMinutes || 30;
      const reminderLimit = slaRules.reminderMinutes || 15;

      const minsSinceAssigned = (now - assigned) / 60000;
      if (minsSinceAssigned > firstCallLimit) {
        lead.slaStatus = 'BREACHED';
      } else if (minsSinceAssigned > reminderLimit) {
        lead.slaStatus = 'AT_RISK';
      } else {
        lead.slaStatus = 'ON_TIME';
      }
    } else {
      lead.slaStatus = 'ON_TIME';
    }

    return lead;
  }

  async runBatchSlaCheck() {
    const activeLeads = await Lead.find({
      currentStatus: { $in: ['New', 'Calling'] },
      assignedEmployee: { $ne: null }
    });

    let breachedCount = 0;
    for (const ld of activeLeads) {
      const oldStatus = ld.slaStatus;
      await this.evaluateLeadAgingAndSla(ld);
      await ld.save();
      if (ld.slaStatus === 'BREACHED' && oldStatus !== 'BREACHED') {
        breachedCount++;
      }
    }
    return breachedCount;
  }
}

module.exports = new SlaManagementService();
