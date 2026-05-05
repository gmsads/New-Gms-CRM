const AuditLog = require('../domains/hr/auditLog.model');

/**
 * createAuditLog — Helper to write an immutable audit entry.
 * Call this from any controller that performs a sensitive action.
 * 
 * @param {Object} options
 * @param {string} options.action - from AuditLog enum
 * @param {Object} options.performedBy - req.user
 * @param {Object} [options.targetEmployee] - affected user doc or ID
 * @param {*} [options.previousValue]
 * @param {*} [options.newValue]
 * @param {string[]} [options.changedFields]
 * @param {Object} [options.req] - Express request (for IP / user-agent)
 * @param {string} [options.notes]
 * @param {string} [options.relatedApproval]
 */
const createAuditLog = async ({
  action,
  performedBy,
  targetEmployee,
  previousValue,
  newValue,
  changedFields = [],
  req = null,
  notes,
  relatedApproval,
}) => {
  try {
    await AuditLog.create({
      action,
      performedBy: performedBy?._id || performedBy,
      performedByRole: performedBy?.role,
      targetEmployee: targetEmployee?._id || targetEmployee,
      previousValue,
      newValue,
      changedFields,
      ipAddress: req ? (req.ip || req.headers['x-forwarded-for']) : undefined,
      userAgent: req ? req.headers['user-agent'] : undefined,
      notes,
      relatedApproval,
    });
  } catch (err) {
    // Audit failures must never crash the main operation — just log to stderr
    console.error('[AUDIT LOG ERROR]', err.message);
  }
};

module.exports = { createAuditLog };
