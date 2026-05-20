const AuditLog = require('../../domains/hr/auditLog.model');

class AuditWorkflowService {
  /**
   * Logs a generic edit/delete or state transition action across CRM modules
   */
  async log(data) {
    try {
      const logEntry = new AuditLog({
        action: data.action,
        performedBy: data.performedBy,
        targetModel: data.targetModel,
        targetId: data.targetId,
        previousValue: data.previousValue,
        newValue: data.newValue,
        changedFields: data.changedFields || [],
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        device: data.device,
        notes: data.notes
      });
      await logEntry.save();
      return logEntry;
    } catch (err) {
      console.error('AuditLog Error:', err);
      // We do not throw to prevent blocking the main business transaction
    }
  }

  async trackUpdate(targetModel, targetId, performedBy, previousDoc, newDoc, reqContext = {}) {
    const changes = {};
    const changedFields = [];
    
    // Identify what changed (shallow compare)
    for (const key in newDoc) {
      if (key !== 'updatedAt' && key !== 'createdAt' && JSON.stringify(previousDoc[key]) !== JSON.stringify(newDoc[key])) {
        changes[key] = { old: previousDoc[key], new: newDoc[key] };
        changedFields.push(key);
      }
    }

    if (changedFields.length > 0) {
      await this.log({
        action: `${targetModel.toUpperCase()}_UPDATED`,
        performedBy,
        targetModel,
        targetId,
        previousValue: previousDoc,
        newValue: newDoc,
        changedFields,
        ipAddress: reqContext.ipAddress,
        userAgent: reqContext.userAgent,
        device: reqContext.device
      });
    }
  }
}

module.exports = new AuditWorkflowService();
