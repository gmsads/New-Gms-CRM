const Leave = require('../../domains/hr/leave.model');
const User = require('../../domains/users/user.model');
const Notification = require('../../domains/hr/notification.model');
const { createAuditLog } = require('../../guards/audit.helper');

// Check annual leave balance
const checkLeaveBalance = async (employeeId, leaveType, requestedDays) => {
  const currentYear = new Date().getFullYear();
  const start = new Date(currentYear, 0, 1);
  const end = new Date(currentYear, 11, 31);
  const used = await Leave.aggregate([
    { $match: { employee: employeeId, leaveType, status: { $in: ['HR_APPROVED', 'ADMIN_APPROVED'] }, fromDate: { $gte: start, $lte: end } } },
    { $group: { _id: null, total: { $sum: '$totalDays' } } },
  ]);
  const usedDays = used[0]?.total || 0;
  const limit = Leave.schema.statics?.LEAVE_LIMITS?.[leaveType] || Leave.LEAVE_LIMITS?.[leaveType] || 999;
  return { usedDays, limit, remaining: limit - usedDays, canTake: (usedDays + requestedDays) <= limit };
};

exports.submitLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason, attachmentUrl } = req.body;
    const from = new Date(fromDate), to = new Date(toDate);
    const totalDays = Math.floor((to - from) / (1000 * 60 * 60 * 24)) + 1;

    const balance = await checkLeaveBalance(req.user._id, leaveType, totalDays);
    if (!balance.canTake) {
      return res.status(400).json({ message: `Leave limit exceeded. Remaining: ${balance.remaining} days for ${leaveType}.` });
    }

    const leave = await Leave.create({
      employee: req.user._id, leaveType, fromDate: from, toDate: to,
      reason, attachmentUrl, leaveBalanceAtRequest: balance.remaining,
    });

    await createAuditLog({ action: 'LEAVE_SUBMITTED', performedBy: req.user, targetEmployee: req.user._id, newValue: { leaveType, totalDays }, req });

    const hrs = await User.find({ role: 'HR', status: 'ACTIVE' }).select('_id');
    await Notification.insertMany(hrs.map(hr => ({
      recipient: hr._id, type: 'LEAVE_SUBMITTED',
      title: `Leave Request — ${req.user.name}`,
      message: `${req.user.name} requested ${totalDays} day(s) of ${leaveType} leave.`,
      priority: 'MEDIUM', relatedEntity: { entityType: 'Leave', entityId: leave._id },
    })));

    res.status(201).json({ message: 'Leave submitted successfully.', leave, balance });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getLeaves = async (req, res) => {
  try {
    const { status, employeeId, leaveType, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;
    // Employees can only see their own
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC') filter.employee = req.user._id;
    else if (employeeId) filter.employee = employeeId;

    const skip = (page - 1) * limit;
    const [leaves, total] = await Promise.all([
      Leave.find(filter).populate('employee', 'name department role').populate('hrReviewedBy', 'name').populate('adminReviewedBy', 'name').sort('-createdAt').skip(skip).limit(Number(limit)),
      Leave.countDocuments(filter),
    ]);
    res.json({ leaves, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.hrReviewLeave = async (req, res) => {
  try {
    const { action, notes } = req.body; // action: 'APPROVE' | 'REJECT'
    const leave = await Leave.findById(req.params.id).populate('employee', 'name _id');
    if (!leave) return res.status(404).json({ message: 'Leave not found.' });
    if (leave.status !== 'PENDING') return res.status(400).json({ message: 'Leave already reviewed.' });

    leave.status = action === 'APPROVE' ? 'HR_APPROVED' : 'HR_REJECTED';
    leave.hrReviewedBy = req.user._id;
    leave.hrReviewedAt = new Date();
    leave.hrNotes = notes || '';
    await leave.save();

    const auditAction = action === 'APPROVE' ? 'LEAVE_HR_APPROVED' : 'LEAVE_HR_REJECTED';
    await createAuditLog({ action: auditAction, performedBy: req.user, targetEmployee: leave.employee._id, newValue: { leaveStatus: leave.status }, req });

    await Notification.create({
      recipient: leave.employee._id, type: action === 'APPROVE' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      title: `Leave ${action === 'APPROVE' ? 'Approved' : 'Rejected'} by HR`,
      message: notes || `Your leave request has been ${action === 'APPROVE' ? 'approved' : 'rejected'} by HR.`,
      priority: 'HIGH', relatedEntity: { entityType: 'Leave', entityId: leave._id },
    });

    res.json({ message: `Leave ${action === 'APPROVE' ? 'approved' : 'rejected'} by HR.`, leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminOverrideLeave = async (req, res) => {
  try {
    const { action, notes } = req.body;
    const leave = await Leave.findById(req.params.id).populate('employee', 'name _id');
    if (!leave) return res.status(404).json({ message: 'Leave not found.' });

    leave.status = action === 'APPROVE' ? 'ADMIN_APPROVED' : 'ADMIN_REJECTED';
    leave.adminReviewedBy = req.user._id;
    leave.adminReviewedAt = new Date();
    leave.adminNotes = notes || '';
    await leave.save();

    const auditAction = action === 'APPROVE' ? 'LEAVE_ADMIN_APPROVED' : 'LEAVE_ADMIN_REJECTED';
    await createAuditLog({ action: auditAction, performedBy: req.user, targetEmployee: leave.employee._id, newValue: { leaveStatus: leave.status }, req });

    await Notification.create({
      recipient: leave.employee._id, type: action === 'APPROVE' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      title: `Leave ${action === 'APPROVE' ? 'Approved' : 'Rejected'} by Admin`,
      message: notes || `Your leave has been ${action === 'APPROVE' ? 'approved' : 'rejected'} by Admin.`,
      priority: 'CRITICAL', relatedEntity: { entityType: 'Leave', entityId: leave._id },
    });

    res.json({ message: `Admin override applied: ${leave.status}`, leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
