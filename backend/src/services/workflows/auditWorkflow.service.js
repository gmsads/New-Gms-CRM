const AuditLog = require('../../domains/hr/auditLog.model');

class AuditWorkflowService {
  /**
   * Logs a generic edit/delete or state transition action across CRM modules
   */
  async log(data) {
    try {
      let prev = data.previousValue;
      let next = data.newValue;

      if (prev && typeof prev.toObject === 'function') prev = prev.toObject();
      if (next && typeof next.toObject === 'function') next = next.toObject();

      const logEntry = new AuditLog({
        action: data.action,
        performedBy: data.performedBy,
        targetModel: data.targetModel,
        targetId: data.targetId,
        previousValue: prev,
        newValue: next,
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
    
    const prevObj = previousDoc && typeof previousDoc.toObject === 'function' ? previousDoc.toObject() : (previousDoc || {});
    const newObj = newDoc && typeof newDoc.toObject === 'function' ? newDoc.toObject() : (newDoc || {});

    // Identify what changed (shallow compare)
    for (const key in newObj) {
      if (key !== 'updatedAt' && key !== 'createdAt' && key !== '__v' && key !== '_id') {
        try {
          if (JSON.stringify(prevObj[key]) !== JSON.stringify(newObj[key])) {
            changes[key] = { old: prevObj[key], new: newObj[key] };
            changedFields.push(key);
          }
        } catch (e) {
          // Ignore if JSON.stringify fails for a specific field
        }
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
