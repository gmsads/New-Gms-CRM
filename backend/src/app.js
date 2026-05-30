const express = require('express');
const cors    = require('cors'); // refreshed

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight for all routes
app.options('/{*splat}', cors());

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// Security Middlewares
try {
  const helmet = require('helmet');
  const mongoSanitize = require('express-mongo-sanitize');
  const xss = require('xss-clean');
  app.use(helmet());
  // app.use(mongoSanitize());
  // app.use(xss()); // Disabled: Causes "Cannot set property query" crash on newer Express versions
} catch (e) {
  console.error('[SECURITY] Missing security packages. Run npm install helmet express-mongo-sanitize xss-clean');
}


const { globalLimiter } = require('./api/middlewares/rateLimiter');
const healthController = require('./api/controllers/health.controller');
const logger = require('./utils/logger');

// Global Rate Limiting
app.use(globalLimiter);

const path = require('path');

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// Serve static files (like uploaded brochures)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ── Health check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'GMS CRM API running', time: new Date() }));
app.get('/health', healthController.checkHealth);

// ── Auth (no extra deps) ─────────────────────────────────────────────────────
try {
  app.use('/api/auth', require('./api/routes/auth.routes'));
  console.log('[ROUTES] ✅ auth');
} catch (e) { console.error('[ROUTES] ❌ auth:', e.message); }

try {
  app.use('/api/permissions', require('./api/routes/permission.routes'));
  console.log('[ROUTES] ✅ permissions');
} catch (e) { console.error('[ROUTES] ❌ permissions:', e.message); }

// ── Core modules ─────────────────────────────────────────────────────────────
const coreRoutes = [
  ['/api/clients',   './api/routes/client.routes'],
  ['/api/campaigns', './api/routes/campaign.routes'],
  ['/api/tasks',     './api/routes/task.routes'],
  ['/api/targets',   './api/routes/target.routes'],
];
for (const [path, mod] of coreRoutes) {
  try { app.use(path, require(mod)); console.log(`[ROUTES] ✅ ${path}`); }
  catch (e) { console.error(`[ROUTES] ❌ ${path}:`, e.message); }
}

// ── HR Module ────────────────────────────────────────────────────────────────
// (Unused route requires removed to prevent crashes)

// Queue Monitoring Dashboard (Admin Only)
const { serverAdapter } = require('./services/queues/queueManager');
if (serverAdapter) {
  const { protect, authorize } = require('./guards/auth.guard');
  app.use('/api/admin/queues', protect, authorize('ADMIN'), serverAdapter.getRouter());
}

const hrRoutesList = [
  ['/api/employees',  './api/routes/employee.routes'],
  ['/api/approvals',  './api/routes/approval.routes'],
  ['/api/attendance', './api/routes/attendance.routes'],
  ['/api/leaves',     './api/routes/leave.routes'],
  ['/api/audit-logs', './api/routes/audit.routes'],
  ['/api/activities', './api/routes/activity.routes'],
  ['/api/hr-recruitment', './api/routes/hrRecruitment.routes'],
  ['/api/hr-compensation', './api/routes/hrCompensation.routes'],
  ['/api/hr-documents', './api/routes/hrDocument.routes'],
  ['/api/hr-dashboard', './api/routes/hrDashboard.routes'],
  ['/api/hr-training', './api/routes/hrTraining.routes'],
  ['/api/hr-exit', './api/routes/hrExit.routes'],
];
for (const [path, mod] of hrRoutesList) {
  try { app.use(path, require(mod)); console.log(`[ROUTES] ✅ ${path}`); }
  catch (e) { console.error(`[ROUTES] ❌ ${path}:`, e.message); }
}

// ── Sales Module ─────────────────────────────────────────────────────────────
const salesRoutes = [
  ['/api/prospects',  './api/routes/prospect.routes'],
  ['/api/quotations', './api/routes/quotation.routes'],
  ['/api/followups',  './api/routes/followup.routes'],
  ['/api/appointments', './api/routes/appointment.routes'],
  ['/api/brochures',  './api/routes/brochure.routes'],
  ['/api/products',   './api/routes/product.routes'],
];
for (const [path, mod] of salesRoutes) {
  try { app.use(path, require(mod)); console.log(`[ROUTES] ✅ ${path}`); }
  catch (e) { console.error(`[ROUTES] ❌ ${path}:`, e.message); }
}

// ── Field Module ─────────────────────────────────────────────────────────────
try { app.use('/api/visits', require('./api/routes/visit.routes')); console.log('[ROUTES] ✅ /api/visits'); }
catch (e) { console.error('[ROUTES] ❌ /api/visits:', e.message); }

// ── Sales Execution Module ────────────────────────────────────────────────────
try { app.use('/api/orders', require('./api/routes/order.routes')); console.log('[ROUTES] ✅ /api/orders'); }
catch (e) { console.error('[ROUTES] ❌ /api/orders:', e.message); }

try { app.use('/api/payments', require('./api/routes/payment.routes')); console.log('[ROUTES] ✅ /api/payments'); }
catch (e) { console.error('[ROUTES] ❌ /api/payments:', e.message); }

try { app.use('/api/analytics', require('./api/routes/analytics.routes')); console.log('[ROUTES] ✅ /api/analytics'); }
catch (e) { console.error('[ROUTES] ❌ /api/analytics:', e.message); }

// ── Operations Module ─────────────────────────────────────────────────────────
try { app.use('/api/vendors', require('./api/routes/vendor.routes')); console.log('[ROUTES] ✅ /api/vendors'); }
catch (e) { console.error('[ROUTES] ❌ /api/vendors:', e.message); }

try { app.use('/api/design', require('./api/routes/design.routes')); console.log('[ROUTES] ✅ /api/design'); }
catch (e) { console.error('[ROUTES] ❌ /api/design:', e.message); }

try { app.use('/api/production', require('./api/routes/production.routes')); console.log('[ROUTES] ✅ /api/production'); }
catch (e) { console.error('[ROUTES] ❌ /api/production:', e.message); }

// ── Service / Field Operations Module ──────────────────────────────────────────
try { app.use('/api/service', require('./api/routes/service.routes')); console.log('[ROUTES] ✅ /api/service'); }
catch (e) { console.error('[ROUTES] ❌ /api/service:', e.message); }

try { app.use('/api/labour', require('./api/routes/labour.routes')); console.log('[ROUTES] ✅ /api/labour'); }
catch (e) { console.error('[ROUTES] ❌ /api/labour:', e.message); }

try { app.use('/api/vehicles', require('./api/routes/vehicle.routes')); console.log('[ROUTES] ✅ /api/vehicles'); }
catch (e) { console.error('[ROUTES] ❌ /api/vehicles:', e.message); }

// ── 404 catch ────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} not found` }));

// ── Global error handler ─────────────────────────────────────────────────────
const errorHandler = require('./api/middlewares/error.middleware');
app.use(errorHandler);

module.exports = app;
