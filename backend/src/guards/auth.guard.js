const jwt = require('jsonwebtoken');
const User = require('../domains/users/user.model');
const UserPermission = require('../domains/users/user_permission.model');
const { getCache, setCache } = require('../services/cache/redis.service');

/**
 * protect — Verifies JWT and loads user.
 * ENFORCES STATUS: Only ACTIVE or PROBATION users can access APIs.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

    // Load user — always get fresh status from DB (prevents stale tokens)
    const user = await User.findById(decoded.id).select('-password -aadhaarNumber -currentSalary');

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    // ── STATUS ENFORCEMENT (non-negotiable) ────────────────
    if (!user.canLogin()) {
      const messages = {
        PENDING_APPROVAL: 'Your account is pending admin approval. Please wait.',
        INACTIVE: 'Your account has been deactivated. Contact HR.',
        SUSPENDED: 'Your account has been suspended. Contact Admin.',
      };
      return res.status(403).json({
        message: messages[user.status] || 'Account access denied.',
        status: user.status,
      });
    }

    // ── ATTACH DYNAMIC PERMISSIONS ─────────────────────────
    const cacheKey = `user:perms:${user._id}`;
    let userPerms = await getCache(cacheKey);

    if (!userPerms) {
      const perms = await UserPermission.find({ user_id: user._id }).select('permission_key scope');
      userPerms = perms.map(p => ({ key: p.permission_key, scope: p.scope }));
      await setCache(cacheKey, userPerms, 3600); // 1-hour cache
    }

    user.permissions = userPerms;
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Not authorized. Invalid token.' });
  }
};

/**
 * authorize — Role-based access control.
 * Usage: authorize('ADMIN', 'MD_CEO')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user?.role || 'Unknown'}.`,
      });
    }
    next();
  };
};

/**
 * requirePermission — Dynamic permission-based access control.
 * Usage: requirePermission('TARGET_ASSIGNMENT')
 * Also allows access if the user has ADMIN or MD_CEO roles.
 */
const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized.' });
    }
    // Admins bypass
    if (['ADMIN', 'MD_CEO'].includes(req.user.role)) {
      return next();
    }
    // Check dynamic permissions
    const hasPerm = req.user.permissions?.some(p => p.key === permissionKey);
    if (!hasPerm) {
      return res.status(403).json({
        message: `Access denied. Missing required permission: ${permissionKey}.`
      });
    }
    next();
  };
};

/**
 * preventRoleEscalation — Blocks HR from assigning restricted roles.
 * Must be used on any route that accepts a 'role' field in the body.
 * 
 * HR cannot assign: MD_CEO, ADMIN
 * Only ADMIN and MD_CEO can assign those roles.
 */
const preventRoleEscalation = (req, res, next) => {
  const { role: requestedRole } = req.body;
  if (!requestedRole) return next();

  const actorRole = req.user?.role;
  const restrictedRoles = User.statics?.HR_RESTRICTED_ROLES || ['MD_CEO', 'ADMIN'];

  // If the actor is HR (or lower), block assigning privileged roles
  if (!['MD_CEO', 'ADMIN'].includes(actorRole) && restrictedRoles.includes(requestedRole)) {
    return res.status(403).json({
      message: `Role escalation blocked. You cannot assign the '${requestedRole}' role.`,
    });
  }
  next();
};

/**
 * hrOnly — Shorthand: only HR, ADMIN, MD_CEO can proceed.
 */
const hrOnly = authorize('HR', 'ADMIN', 'MD_CEO');

/**
 * managerOnly — Shorthand: only Managers, ADMIN, MD_CEO can proceed.
 */
const managerOnly = authorize('SALES_MANAGER', 'SR_SALES_MANAGER', 'ADMIN', 'MD_CEO');

/**
 * adminOnly — Shorthand: only ADMIN and MD_CEO can proceed.
 */
const adminOnly = authorize('ADMIN', 'MD_CEO');

module.exports = { protect, authorize, requirePermission, preventRoleEscalation, hrOnly, adminOnly, managerOnly };
