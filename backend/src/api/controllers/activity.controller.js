const AuditLog = require('../../domains/hr/auditLog.model');

// ── GET /api/activities ───────────────────────────────────────────────────────────
exports.getFeed = async (req, res, next) => {
  try {
    const { targetModel, action, limit = 50, page = 1 } = req.query;
    const filter = {};

    // Role-based visibility
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.performedBy = req.user._id;
    } else if (req.user.role === 'SALES_MANAGER') {
      // In a full implementation, you'd find all users managed by this manager.
      // For now, we allow managers to see actions performed by anyone or we can filter later.
    }

    if (targetModel) filter.targetModel = targetModel;
    if (action) filter.action = new RegExp(action, 'i');

    const skip = (page - 1) * limit;

    const activities = await AuditLog.find(filter)
      .populate('performedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await AuditLog.countDocuments(filter);

    res.json({
      success: true,
      message: 'Activity feed fetched successfully',
      data: activities,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      },
      errors: null
    });
  } catch (err) {
    next(err);
  }
};
