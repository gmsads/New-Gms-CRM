const AuditLog = require('../../domains/hr/auditLog.model');

// GET /api/audit-logs — Admin/MD only, full trail
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, performedBy, targetEmployee, from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (performedBy) filter.performedBy = performedBy;
    if (targetEmployee) filter.targetEmployee = targetEmployee;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('performedBy', 'name role')
        .populate('targetEmployee', 'name role department')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);
    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/audit-logs/hr-activity — Admin monitoring of HR actions only
exports.getHRActivityLogs = async (req, res) => {
  try {
    const hrActions = [
      'EMPLOYEE_CREATED', 'ATTENDANCE_MARKED', 'ATTENDANCE_EDITED',
      'LEAVE_HR_APPROVED', 'LEAVE_HR_REJECTED', 'DOCUMENT_UPLOADED',
      'PROFILE_UPDATED', 'EXIT_INITIATED', 'PROBATION_REVIEWED',
    ];
    const { from, to, page = 1, limit = 30 } = req.query;
    const filter = { action: { $in: hrActions } };
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('performedBy', 'name role')
        .populate('targetEmployee', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ]);

    // Suspicious activity detection
    const suspiciousFlags = [];
    const recentHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentCreations = await AuditLog.countDocuments({ action: 'EMPLOYEE_CREATED', createdAt: { $gte: recentHour } });
    if (recentCreations >= 5) suspiciousFlags.push({ type: 'MASS_CREATION', message: `${recentCreations} employees created in the last hour.`, severity: 'HIGH' });
    const recentAttEdits = await AuditLog.countDocuments({ action: 'ATTENDANCE_EDITED', createdAt: { $gte: recentHour } });
    if (recentAttEdits >= 10) suspiciousFlags.push({ type: 'MASS_ATT_EDIT', message: `${recentAttEdits} attendance edits in the last hour.`, severity: 'CRITICAL' });

    res.json({ logs, total, suspiciousFlags, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
