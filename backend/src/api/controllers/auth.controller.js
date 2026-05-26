const User = require('../../domains/users/user.model');
const UserPermission = require('../../domains/users/user_permission.model');
const jwt  = require('jsonwebtoken');
const { createAuditLog } = require('../../guards/audit.helper');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'gms_secret_2026', { expiresIn: '12h' });

// ── GET /api/auth/setup ───────────────────────────────────────────────────────
// One-time setup: creates the first Admin user if none exists.
// Visit http://localhost:5000/api/auth/setup in browser to seed.
exports.setup = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'ADMIN' });
    if (count > 0) {
      const admin = await User.findOne({ role: 'ADMIN' }).select('username email name');
      return res.json({
        message: 'Admin already exists. Use your credentials to login.',
        employeeId: admin.username,
        email: admin.email,
        password: 'GMS@1234 (if not changed)',
        loginUrl: 'http://localhost:5173',
      });
    }

    const admin = new User({
      name:               'Admin User',
      email:              'admin@gms.com',
      phone:              '9999999999',
      role:               'ADMIN',
      department:         'Management',
      status:             'ACTIVE',
      password:           'GMS@1234',
      mustChangePassword: false,
    });
    await admin.save();

    return res.status(201).json({
      success:    true,
      message:    '✅ Admin created successfully!',
      employeeId: admin.username,
      email:      admin.email,
      password:   'GMS@1234',
      loginUrl:   'http://localhost:5173',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
// Accepts { login: "emp-0001" | "EMP-0001" | "email@x.com", password: "..." }
exports.loginUser = async (req, res) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ message: 'Employee ID/email and password are required.' });
    }

    // username is stored lowercase (schema has lowercase:true)
    // so we search with the lowercased version
    const loginNormalized = login.trim().toLowerCase();

    const user = await User.findOne({
      $or: [
        { username: loginNormalized },
        { email:    loginNormalized },
      ],
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid Employee ID or password.' });
    }

    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid Employee ID or password.' });
    }

    // Status gate
    if (!user.canLogin()) {
      const messages = {
        PENDING_APPROVAL: 'Your account is pending Admin approval. Contact HR.',
        INACTIVE:         'Your account has been deactivated. Contact HR.',
        SUSPENDED:        'Your account is suspended. Contact Admin.',
      };
      return res.status(403).json({
        message: messages[user.status] || 'Account access denied.',
        status:  user.status,
      });
    }

    // Log successful login (non-blocking)
    createAuditLog({ action: 'LOGIN', performedBy: user, req }).catch(() => {});

    // Fetch dynamic permissions
    const permissionsData = await UserPermission.find({ user_id: user._id }).select('permission_key scope');
    const permissions = permissionsData.map(p => ({ key: p.permission_key, scope: p.scope }));

    return res.json({
      _id:                user._id,
      name:               user.name,
      email:              user.email,
      username:           user.username,
      role:               user.role,
      status:             user.status,
      department:         user.department,
      profileImage:       user.profileImage,
      mustChangePassword: user.mustChangePassword ?? false,
      token:              generateToken(user._id),
      permissions:        permissions,
    });
  } catch (err) {
    console.error('[LOGIN ERROR]', err.message);
    res.status(500).json({ message: 'Server error during login. Please try again.' });
  }
};

// ── POST /api/auth/change-password ───────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password           = newPassword;
    user.mustChangePassword = false;
    user.passwordChangedAt  = new Date();
    await user.save();

    createAuditLog({ action: 'PASSWORD_CHANGED', performedBy: user, req }).catch(() => {});
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/auth/reset-password/:id ────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'Employee not found.' });

    if (['ADMIN', 'MD_CEO'].includes(target.role) && req.user.role !== 'MD_CEO') {
      return res.status(403).json({ message: 'Only MD/CEO can reset Admin passwords.' });
    }

    const tempPassword        = `GMS@${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    target.password           = tempPassword;
    target.mustChangePassword = true;
    target.lastModifiedBy     = req.user._id;
    await target.save();

    createAuditLog({
      action: 'PASSWORD_RESET', performedBy: req.user,
      targetEmployee: target,
      notes: `Reset by ${req.user.role}: ${req.user.name}`, req,
    }).catch(() => {});

    res.json({
      success:    true,
      message:    `Password reset for ${target.name}.`,
      tempPassword,
      employeeId: target.username,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -aadhaarNumber -currentSalary -passwordResetToken')
      .populate('createdBy', 'name role')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });
    
    // Fetch dynamic permissions
    const permissionsData = await UserPermission.find({ user_id: user._id }).select('permission_key scope');
    user.permissions = permissionsData.map(p => ({ key: p.permission_key, scope: p.scope }));
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/auth/debug-me ────────────────────────────────────────────────────
exports.debugMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Legacy — disabled
exports.registerUser = async (req, res) => {
  res.status(410).json({ message: 'Self-registration is disabled. Contact HR.' });
};
