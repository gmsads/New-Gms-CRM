const Attendance = require('../../domains/hr/attendance.model');
const Approval = require('../../domains/hr/approval.model');
const { createAuditLog } = require('../../guards/audit.helper');

const MAX_EDITS = 2;
const OLD_DAYS = 2;

exports.markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, loginTime, logoutTime, notes, department } = req.body;
    const existing = await Attendance.findOne({ employee: employeeId, date: new Date(date) });
    if (existing) return res.status(409).json({ message: 'Attendance already marked. Use edit endpoint.' });

    let workHours;
    if (loginTime && logoutTime) {
      const [lh, lm] = loginTime.split(':').map(Number);
      const [oh, om] = logoutTime.split(':').map(Number);
      workHours = ((oh * 60 + om) - (lh * 60 + lm)) / 60;
    }

    const record = await Attendance.create({
      employee: employeeId, date: new Date(date), status,
      loginTime, logoutTime, workHours, notes,
      markedBy: req.user._id, department,
    });
    await createAuditLog({ action: 'ATTENDANCE_MARKED', performedBy: req.user, targetEmployee: employeeId, newValue: { date, status }, req });
    res.status(201).json({ message: 'Attendance marked.', record });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.editAttendance = async (req, res) => {
  try {
    const { newStatus, reason, loginTime, logoutTime } = req.body;
    if (!reason) return res.status(400).json({ message: 'Edit reason is required.' });
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ message: 'Record not found.' });

    if (record.editCount >= MAX_EDITS)
      return res.status(403).json({ message: `Maximum ${MAX_EDITS} edits allowed per record.` });

    const daysDiff = (Date.now() - new Date(record.date)) / (1000 * 60 * 60 * 24);
    if (daysDiff > OLD_DAYS && !['ADMIN', 'MD_CEO'].includes(req.user.role)) {
      const approval = await Approval.create({
        type: 'ATTENDANCE_EDIT_OLD', targetEmployee: record.employee,
        initiatedBy: req.user._id, status: 'PENDING',
        previousValue: { status: record.status }, newValue: { status: newStatus }, hrNotes: reason,
      });
      return res.status(202).json({ message: 'Edit requires Admin approval for old records.', approvalId: approval._id });
    }

    record.editLog.push({ editedBy: req.user._id, editedAt: new Date(), previousStatus: record.status, newStatus, reason });
    record.editCount += 1;
    if (newStatus) record.status = newStatus;
    if (loginTime) record.loginTime = loginTime;
    if (logoutTime) record.logoutTime = logoutTime;
    await record.save();
    await createAuditLog({ action: 'ATTENDANCE_EDITED', performedBy: req.user, targetEmployee: record.employee, previousValue: { status: record.status }, newValue: { status: newStatus }, req, notes: reason });
    res.json({ message: 'Attendance updated.', editCount: record.editCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const { employeeId, month, year, department, status } = req.query;
    const filter = {};
    if (employeeId) filter.employee = employeeId;
    if (department) filter.department = department;
    if (status) filter.status = status;
    if (month && year) {
      filter.date = { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) };
    }
    const records = await Attendance.find(filter).populate('employee', 'name department role').populate('markedBy', 'name').sort({ date: -1 }).limit(500);
    res.json({ records, total: records.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const { month, year, department } = req.query;
    if (!month || !year) return res.status(400).json({ message: 'Month and year required.' });
    const filter = { date: { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) } };
    if (department) filter.department = department;
    const report = await Attendance.aggregate([
      { $match: filter },
      { $group: { _id: { employee: '$employee', status: '$status' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.employee', statusBreakdown: { $push: { status: '$_id.status', count: '$count' } }, totalDays: { $sum: '$count' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' },
      { $project: { employeeName: '$employee.name', department: '$employee.department', role: '$employee.role', statusBreakdown: 1, totalDays: 1 } },
    ]);
    res.json({ report, month, year });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
