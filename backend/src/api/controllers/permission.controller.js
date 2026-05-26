const Permission = require('../../domains/users/permission.model');
const UserPermission = require('../../domains/users/user_permission.model');
const User = require('../../domains/users/user.model');

// Pre-populate core permissions if they don't exist
const initializeCorePermissions = async () => {
  const corePermissions = [
    { permission_key: 'TARGET_ASSIGNMENT', permission_name: 'Target Assignment', module_name: 'Operations', description: 'Assign targets to employees' },
    { permission_key: 'ORDER_VERIFICATION', permission_name: 'Order Verification', module_name: 'Operations', description: 'Verify generated orders' },
    { permission_key: 'TASK_ASSIGNMENT', permission_name: 'Task Assignment', module_name: 'Operations', description: 'Assign tasks to employees' },
    { permission_key: 'VENDOR_MANAGEMENT', permission_name: 'Vendor Management', module_name: 'Operations', description: 'Manage vendors and vendor orders' },
    { permission_key: 'QUOTATION_MANAGEMENT', permission_name: 'Quotation Management', module_name: 'Operations', description: 'Manage and approve quotations' },
    { permission_key: 'PAYMENT_VERIFICATION', permission_name: 'Payment Verification', module_name: 'Finance', description: 'Verify received payments' },
    { permission_key: 'ADVANCE_APPROVAL', permission_name: 'Advance Payment Approval', module_name: 'Finance', description: 'Approve orders with low advance' },
    { permission_key: 'REPORTS_ACCESS', permission_name: 'Reports Access', module_name: 'Analytics', description: 'Access system reports and analytics' },
    { permission_key: 'INVENTORY_CATALOG', permission_name: 'Inventory & Catalog', module_name: 'Inventory', description: 'Manage products and catalogs' }
  ];

  for (const p of corePermissions) {
    await Permission.findOneAndUpdate({ permission_key: p.permission_key }, p, { upsert: true, new: true });
  }
};

exports.getAvailablePermissions = async (req, res) => {
  try {
    await initializeCorePermissions();
    const permissions = await Permission.find().sort({ module_name: 1, permission_name: 1 });
    res.json({ success: true, data: permissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllAssignedPermissions = async (req, res) => {
  try {
    const assigned = await UserPermission.find()
      .populate('user_id', 'name email role department')
      .populate('assigned_by', 'name role')
      .sort({ createdAt: -1 });

    const permissionsData = await Permission.find();
    const permissionMap = permissionsData.reduce((acc, p) => {
      acc[p.permission_key] = p;
      return acc;
    }, {});

    const enriched = assigned.map(up => {
      const pInfo = permissionMap[up.permission_key] || {};
      return {
        _id: up._id,
        user: up.user_id,
        permission_key: up.permission_key,
        permission_name: pInfo.permission_name || up.permission_key,
        module_name: pInfo.module_name || 'Unknown',
        scope: up.scope,
        assigned_by: up.assigned_by,
        assigned_at: up.createdAt
      };
    });

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const assigned = await UserPermission.find({ user_id: userId })
      .populate('assigned_by', 'name');
    res.json({ success: true, data: assigned });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignPermission = async (req, res) => {
  try {
    const { user_id, permission_key, scope } = req.body;
    if (!user_id || !permission_key) {
      return res.status(400).json({ success: false, message: 'User ID and Permission Key are required.' });
    }

    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Upsert so a user only has one active record for a given permission
    const updated = await UserPermission.findOneAndUpdate(
      { user_id, permission_key },
      { scope: scope || 'SELF', assigned_by: req.user._id },
      { upsert: true, new: true }
    ).populate('user_id', 'name email role').populate('assigned_by', 'name');

    const pInfo = await Permission.findOne({ permission_key });

    res.status(201).json({
      success: true,
      message: 'Permission assigned successfully.',
      data: {
        ...updated.toObject(),
        permission_name: pInfo ? pInfo.permission_name : permission_key,
        module_name: pInfo ? pInfo.module_name : 'Unknown'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.revokePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await UserPermission.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Permission assignment not found.' });
    }
    res.json({ success: true, message: 'Permission revoked successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
