const express = require('express');
const cors    = require('cors'); // refreshed

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
const envOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'https://crm.globalmarketingsolutions.in',
  ...envOrigins
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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
app.use('/api/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ── Health check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'GMS CRM API running', time: new Date() }));
app.get('/health', healthController.checkHealth);

// ── Auth (no extra deps) ─────────────────────────────────────────────────────
try {
  const authRoutes = require('./api/routes/auth.routes');
  app.use('/api/auth', authRoutes);
  console.log('[ROUTES] ✅ auth');
} catch (e) { console.error('[ROUTES] ❌ auth:', e.message); }

try {
  const permRoutes = require('./api/routes/permission.routes');
  app.use('/api/permissions', permRoutes);
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
  try { 
    const router = require(mod);
    app.use(path, router); 
    console.log(`[ROUTES] ✅ ${path}`); 
  }
  catch (e) { console.error(`[ROUTES] ❌ ${path}:`, e.message); }
}

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
  ['/api/performance', './api/routes/performance.routes'],
  ['/api/teams', './api/routes/team.routes'],
  ['/api/settings', './api/routes/settings.routes'],
];
for (const [path, mod] of hrRoutesList) {
  try { 
    const router = require(mod);
    app.use(path, router); 
    console.log(`[ROUTES] ✅ ${path}`); 
  }
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
  try { 
    const router = require(mod);
    app.use(path, router); 
    console.log(`[ROUTES] ✅ ${path}`); 
  }
  catch (e) { console.error(`[ROUTES] ❌ ${path}:`, e.message); }
}

// Helper to load individual modules
const mountModule = (routePath, modulePath) => {
  try { 
    const router = require(modulePath);
    app.use(routePath, router);
    console.log(`[ROUTES] ✅ ${routePath}`); 
  }
  catch (e) { console.error(`[ROUTES] ❌ ${routePath}:`, e.message); }
};

// ── Field Module ─────────────────────────────────────────────────────────────
mountModule('/api/visits', './api/routes/visit.routes');

// ── Sales Execution Module ────────────────────────────────────────────────────
mountModule('/api/orders', './api/routes/order.routes');
mountModule('/api/payments', './api/routes/payment.routes');
mountModule('/api/analytics', './api/routes/analytics.routes');

// ── Operations Module ─────────────────────────────────────────────────────────
mountModule('/api/vendors', './api/routes/vendor.routes');

mountModule('/api/design', './api/routes/design.routes');
mountModule('/api/production', './api/routes/production.routes');

// ── Service / Field Operations Module ──────────────────────────────────────────
mountModule('/api/service', './api/routes/service.routes');
mountModule('/api/labour', './api/routes/labour.routes');
mountModule('/api/vehicles', './api/routes/vehicle.routes');

// ── Enterprise Lead Management & Tele Sales Module ──────────────────────────────
mountModule('/api/telecrm', './domains/telecrm/routes/telecrm.routes');

// ── Enterprise Communication Center Webhooks ──────────────────────────────────
mountModule('/api/webhooks', './api/routes/notificationWebhook.routes');

// ── Enterprise Workforce Intelligence & Timeline Engine ───────────────────────
mountModule('/api/timeline', './api/routes/timeline.routes');

// ── 404 catch ────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} not found` }));

// ── Global error handler ─────────────────────────────────────────────────────
const errorHandler = require('./api/middlewares/error.middleware');
app.use(errorHandler);

module.exports = app;
