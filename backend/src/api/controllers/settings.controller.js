const Settings = require('../../domains/settings/settings.model');

// Pre-seed defaults if not exist
const DEFAULT_ROLES = ['CEO','COO','BRANCH_HEAD','SALES_EXEC','SALES_MANAGER','FIELD_EXEC','OPERATION_EXEC','OPERATION_MANAGER','PRODUCTION_MANAGER','PRODUCTION_EXEC','DESIGNER','SERVICE_MANAGER','SERVICE_EXEC','IT','ACCOUNTS','AGENT','VENDOR','HR'];
const DEFAULT_DEPTS = ['Sales','Operations','Design & Creative','Field','IT','Accounts','Human Resources','Vendor Management','Management'];

const getSettings = async () => {
  let settings = await Settings.findOne({ type: 'GLOBAL' });
  if (!settings) {
    settings = await Settings.create({ type: 'GLOBAL', roles: DEFAULT_ROLES, departments: DEFAULT_DEPTS });
  }
  return settings;
};

exports.getGlobalSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ message: 'Role is required' });
    const formattedRole = role.trim().toUpperCase().replace(/\s+/g, '_');
    
    const settings = await getSettings();
    if (!settings.roles.includes(formattedRole)) {
      settings.roles.push(formattedRole);
      await settings.save();
    }
    res.json({ message: 'Role added successfully', settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeRole = async (req, res) => {
  try {
    const { role } = req.body;
    const settings = await getSettings();
    settings.roles = settings.roles.filter(r => r !== role);
    await settings.save();
    res.json({ message: 'Role removed successfully', settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    if (!department) return res.status(400).json({ message: 'Department is required' });
    const formattedDept = department.trim();
    
    const settings = await getSettings();
    if (!settings.departments.includes(formattedDept)) {
      settings.departments.push(formattedDept);
      await settings.save();
    }
    res.json({ message: 'Department added successfully', settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.removeDepartment = async (req, res) => {
  try {
    const { department } = req.body;
    const settings = await getSettings();
    settings.departments = settings.departments.filter(d => d !== department);
    await settings.save();
    res.json({ message: 'Department removed successfully', settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
