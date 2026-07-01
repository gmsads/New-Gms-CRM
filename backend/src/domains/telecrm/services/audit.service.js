const TeleAudit = require('../models/teleAudit.model');

class AuditService {
  async log({ userId, userName, userRole, action, targetId, targetModel, oldValue, newValue, ip, device }) {
    try {
      if (!userId || !action) return null;
      return await TeleAudit.appendAudit({
        userId,
        userName: userName || 'System',
        userRole: userRole || 'USER',
        action,
        targetId: targetId || null,
        targetModel: targetModel || 'Lead',
        oldValue: oldValue || null,
        newValue: newValue || null,
        ip: ip || '127.0.0.1',
        device: device || 'Web/Mobile App'
      });
    } catch (err) {
      console.error('Audit log failed:', err.message);
      return null;
    }
  }

  async getLogs({ targetId, userId, action, limit = 50, page = 1 }) {
    const query = {};
    if (targetId) query.targetId = targetId;
    if (userId) query.userId = userId;
    if (action) query.action = action;

    const skip = (page - 1) * limit;
    const logs = await TeleAudit.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await TeleAudit.countDocuments(query);
    return { logs, total, page, limit };
  }
}

module.exports = new AuditService();
