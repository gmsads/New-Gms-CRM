const User = require('../users/user.model');
const Promotion = require('./promotion.model');

exports.promoteEmployee = async (req, res) => {
  try {
    const { employeeId, newRole, newHierarchyLevel, newReportingManager, newDepartment, newTeam, reason } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    // Track old data
    const promotionLog = new Promotion({
      employee: employeeId,
      promotedBy: req.user._id,
      previousRole: employee.role,
      newRole,
      previousHierarchyLevel: employee.hierarchyLevel,
      newHierarchyLevel,
      previousReportingManager: employee.reportingManager,
      newReportingManager,
      previousDepartment: employee.department,
      newDepartment: newDepartment || employee.department,
      previousTeam: employee.teamId,
      newTeam: newTeam || employee.teamId,
      reason
    });

    await promotionLog.save();

    // Update Employee
    employee.role = newRole;
    if (newHierarchyLevel !== undefined) employee.hierarchyLevel = newHierarchyLevel;
    if (newReportingManager) employee.reportingManager = newReportingManager;
    if (newDepartment) employee.department = newDepartment;
    if (newTeam) employee.teamId = newTeam;

    await employee.save();

    res.status(200).json({ success: true, data: employee, message: 'Employee promoted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPromotionHistory = async (req, res) => {
  try {
    const history = await Promotion.find({ employee: req.params.id })
      .populate('promotedBy', 'name role')
      .populate('newReportingManager', 'name role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
