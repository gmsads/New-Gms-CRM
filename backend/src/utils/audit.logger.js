const AuditLog = require('../domains/hr/auditLog.model');

const logActivity = async (options) => {
  try {
    const {
      action,
      performedBy,
      performedByRole,
      targetEmployee,
      targetModel,
      targetId,
      previousValue,
      newValue,
      changedFields,
      req,
      notes
    } = options;

    const logEntry = new AuditLog({
      action,
      performedBy,
      performedByRole,
      targetEmployee,
      targetModel,
      targetId,
      previousValue,
      newValue,
      changedFields,
      ipAddress: req ? req.ip : 'SYSTEM',
      userAgent: req ? req.headers['user-agent'] : 'SYSTEM',
      notes
    });

    await logEntry.save();
  } catch (error) {
    console.error('[AUDIT LOG ERROR]', error.message);
  }
};

module.exports = { logActivity };
