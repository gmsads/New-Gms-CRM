/**
 * role.guard.js
 * Fine-grained RBAC permission matrix for GMS CRM.
 *
 * Each resource has a set of allowed roles per action.
 * Usage: require('./role.guard').can(action, resource)  → middleware
 *        require('./role.guard').authorize(...roles)     → shorthand
 */

// ─── Permission Matrix ────────────────────────────────────────────────────────
const PERMISSIONS = {

  // ── Prospects ───────────────────────────────────────────────────────────────
  'prospects:create': ['SALES_EXEC', 'SALES_MANAGER', 'FIELD_EXEC', 'ADMIN', 'MD_CEO'],
  'prospects:read':   ['SALES_EXEC', 'SALES_MANAGER', 'FIELD_EXEC', 'ADMIN', 'MD_CEO', 'AGENT'],
  'prospects:update': ['SALES_EXEC', 'SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'prospects:delete': ['SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'prospects:search': ['SALES_EXEC', 'SALES_MANAGER', 'FIELD_EXEC', 'ADMIN', 'MD_CEO', 'AGENT'],

  // ── Orders ──────────────────────────────────────────────────────────────────
  'orders:create':    ['SALES_EXEC', 'SALES_MANAGER', 'FIELD_EXEC', 'ADMIN', 'MD_CEO'],
  'orders:read':      ['SALES_EXEC', 'SALES_MANAGER', 'FIELD_EXEC', 'OPERATION_EXEC', 'OPERATION_MANAGER', 'DESIGNER', 'ADMIN', 'MD_CEO'],
  'orders:update':    ['SALES_EXEC', 'SALES_MANAGER', 'DESIGNER', 'OPERATION_EXEC', 'OPERATION_MANAGER', 'ADMIN', 'MD_CEO'],
  'orders:cancel':    ['SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'orders:confirm':   ['SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'orders:approve_low_advance': ['ADMIN', 'MD_CEO'],

  // ── Payments ─────────────────────────────────────────────────────────────────
  'payments:collect': ['SALES_EXEC', 'SALES_MANAGER', 'FIELD_EXEC', 'ADMIN', 'MD_CEO'],
  'payments:verify':  ['SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'payments:reject':  ['SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'payments:read':    ['SALES_EXEC', 'SALES_MANAGER', 'FIELD_EXEC', 'ADMIN', 'MD_CEO'],

  // ── Quotations ───────────────────────────────────────────────────────────────
  'quotations:create': ['SALES_EXEC', 'SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'quotations:send':   ['SALES_EXEC', 'SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'quotations:read':   ['SALES_EXEC', 'SALES_MANAGER', 'ADMIN', 'MD_CEO', 'AGENT'],

  // ── Design ───────────────────────────────────────────────────────────────────
  'design:request':   ['SALES_EXEC', 'SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'design:assign':    ['SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'design:update':    ['DESIGNER', 'SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'design:approve':   ['SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'design:read':      ['SALES_EXEC', 'SALES_MANAGER', 'DESIGNER', 'OPERATION_EXEC', 'ADMIN', 'MD_CEO'],

  // ── Follow-ups ────────────────────────────────────────────────────────────────
  'followups:create': ['SALES_EXEC', 'SALES_MANAGER', 'FIELD_EXEC', 'ADMIN', 'MD_CEO'],
  'followups:read':   ['SALES_EXEC', 'SALES_MANAGER', 'FIELD_EXEC', 'ADMIN', 'MD_CEO'],
  'followups:complete':['SALES_EXEC', 'SALES_MANAGER', 'FIELD_EXEC', 'ADMIN', 'MD_CEO'],

  // ── Appointments ─────────────────────────────────────────────────────────────
  'appointments:create':['SALES_EXEC', 'SALES_MANAGER', 'FIELD_EXEC', 'ADMIN', 'MD_CEO'],
  'appointments:verify':['SALES_MANAGER', 'ADMIN', 'MD_CEO'],

  // ── Operations ────────────────────────────────────────────────────────────────
  'operations:read':   ['OPERATION_EXEC', 'OPERATION_MANAGER', 'ADMIN', 'MD_CEO'],
  'operations:update': ['OPERATION_EXEC', 'OPERATION_MANAGER', 'ADMIN', 'MD_CEO'],
  'operations:complete':['OPERATION_MANAGER', 'ADMIN', 'MD_CEO'],

  // ── HR ────────────────────────────────────────────────────────────────────────
  'hr:read':     ['HR', 'ADMIN', 'MD_CEO'],
  'hr:write':    ['HR', 'ADMIN', 'MD_CEO'],
  'hr:approve':  ['ADMIN', 'MD_CEO'],
  'hr:salary':   ['ADMIN', 'MD_CEO'],

  // ── Analytics ─────────────────────────────────────────────────────────────────
  'analytics:sales':    ['SALES_MANAGER', 'ADMIN', 'MD_CEO'],
  'analytics:full':     ['ADMIN', 'MD_CEO'],
  'analytics:personal': ['SALES_EXEC', 'FIELD_EXEC', 'SALES_MANAGER', 'ADMIN', 'MD_CEO'],

  // ── Admin ─────────────────────────────────────────────────────────────────────
  'admin:full':  ['ADMIN', 'MD_CEO'],
};

// ─── Middleware: can(action, resource) ────────────────────────────────────────
/**
 * Usage in route:
 *   router.post('/orders', protect, can('orders:create'), createOrder);
 */
const can = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const allowed = PERMISSIONS[permission];
    if (!allowed) {
      // Unknown permission → deny by default (fail-safe)
      return res.status(403).json({ message: `Unknown permission: ${permission}` });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. '${permission}' requires one of: [${allowed.join(', ')}]. Your role: ${req.user.role}.`,
        requiredPermission: permission,
      });
    }

    next();
  };
};

// ─── Middleware: selfOrManager — user can access their own resource, managers can access all ──
/**
 * Usage: protect, selfOrManager('salesExec')
 * req.resource must be populated by a prior middleware (e.g. load order)
 */
const selfOrManager = (ownerField = 'salesExec') => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated.' });

    const managerRoles = ['SALES_MANAGER', 'OPERATION_MANAGER', 'ADMIN', 'MD_CEO'];
    if (managerRoles.includes(req.user.role)) return next();

    // For regular users — must own the resource
    const resource = req.resource;
    if (!resource) return next(); // if resource not loaded, skip check

    const ownerId = resource[ownerField]?.toString();
    if (ownerId && ownerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied. This resource belongs to another executive.' });
    }

    next();
  };
};

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = { can, selfOrManager, PERMISSIONS };
