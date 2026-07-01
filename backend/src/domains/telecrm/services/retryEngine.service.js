const Lead = require('../models/lead.model');
const configurationService = require('./configuration.service');

class RetryEngineService {
  async evaluateOutcome(leadId, callStatus, disposition) {
    const lead = await Lead.findById(leadId);
    if (!lead) return;

    const cfg = await configurationService.getConfig();
    const retryRules = cfg?.retryRules || {};
    const maxRetries = retryRules.maxRetries || 3;

    const outcome = (disposition || callStatus || '').toLowerCase();

    // Stop retry conditions
    if (outcome.includes('interested') || outcome.includes('meeting') || outcome.includes('converted') || outcome.includes('quotation') || outcome.includes('lost')) {
      lead.nextRetryDate = null;
      await lead.save();
      return;
    }

    const currentRetry = (lead.retryCount || 0) + 1;
    if (currentRetry > maxRetries) {
      lead.nextRetryDate = null;
      lead.queueCategory = 'Manager Review';
      await lead.save();
      return;
    }

    lead.retryCount = currentRetry;

    const now = new Date();
    if (outcome.includes('busy')) {
      const delayHours = retryRules.busyRetryHours || 2;
      lead.nextRetryDate = new Date(now.getTime() + delayHours * 3600000);
      lead.queueCategory = 'Retry';
    } else if (outcome.includes('no answer') || outcome.includes('switched off') || outcome.includes('failed')) {
      // Assign Tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);
      lead.nextRetryDate = tomorrow;
      lead.queueCategory = 'Tomorrow'; // Tomorrow Call Queue
    } else if (outcome.includes('network error')) {
      const delayMins = retryRules.networkErrorRetryMinutes || 30;
      lead.nextRetryDate = new Date(now.getTime() + delayMins * 60000);
      lead.queueCategory = 'Retry';
    }

    await lead.save();
  }
}

module.exports = new RetryEngineService();
