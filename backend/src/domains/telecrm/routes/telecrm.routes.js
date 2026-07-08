const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const ctrl = require('../controllers/lead.controller');
const telephonyEnterpriseCtrl = require('../controllers/telephonyEnterprise.controller');
const companionCtrl = require('../controllers/companion.controller');
const { protect, authorize } = require('../../../guards/auth.guard');

// Public Idempotent Webhook Intake for Cloud Telephony Providers (Exotel, Knowlarity, Airtel IQ, etc.)
router.post('/webhook/:provider', telephonyEnterpriseCtrl.handleProviderWebhook);
router.get('/webhook/:provider', telephonyEnterpriseCtrl.handleProviderWebhook);

// Mount JWT protect guard on all remaining telecrm routes
router.use(protect);

// Leads Pool & My Leads work area
router.get('/leads', ctrl.getLeads);
router.post('/leads', ctrl.createManualLead);
router.post('/leads/distribute', ctrl.distributePoolLeads);
router.post('/leads/:id/convert', ctrl.convertLead);

// Admin Dashboard stats
router.get('/dashboard', ctrl.getDashboardStats);

// Bulk Import & Distribution
router.post('/import/preview', ctrl.previewImport);
router.post('/import/commit', ctrl.commitImport);

// Campaigns
router.get('/campaigns', ctrl.listCampaigns);
router.post('/campaigns', ctrl.createCampaign);
router.post('/campaigns/:id/rules', ctrl.saveCampaignRules);

// On-Demand Batching
router.post('/on-demand', ctrl.assignOnDemand);

// Telephony & Disposition
router.post('/calls/initiate', ctrl.initiateCall);
router.post('/calls/popup', ctrl.saveCallDisposition);
router.get('/calls/history', ctrl.getCallHistory);

// Analytics
router.get('/reports/:type', (req, res, next) => {
  const allowedRoles = ['ADMIN', 'MD_CEO', 'SALES_MANAGER'];
  const hasRole = req.user && allowedRoles.includes(req.user.role);
  const hasPerm = req.user && req.user.permissions?.some(p => p.key === 'TELESALES_LEADS' || p.key === 'REPORTS_ACCESS');
  if (hasRole || hasPerm) return next();
  return res.status(403).json({ message: 'Access denied to telecrm reports.' });
}, ctrl.getReports);

// Additive Enterprise Routes
router.get('/live-status', ctrl.getLiveWallboard);
router.post('/live-status', ctrl.updateWorkingStatus);
router.get('/config', ctrl.getEnterpriseConfig);
router.put('/config', ctrl.saveEnterpriseConfig);
router.post('/qa/:callId', ctrl.submitQaScore);
router.get('/qa', ctrl.listQaReviews);
router.get('/eod-report', ctrl.getEodAnalytics);
router.get('/audit', ctrl.getAuditTrail);
router.get('/fraud-alerts', ctrl.listFraudAlerts);
router.get('/ceo-funnel', ctrl.getCeoFunnel);
router.get('/scorecard', ctrl.getExecutiveScorecard);
router.post('/bulk-actions', ctrl.runBulkActions);

// Additive Enterprise Telephony Calling & Recording Endpoints
router.get('/calls/:id/stream', telephonyEnterpriseCtrl.streamRecording);
router.get('/calls/:id/download', telephonyEnterpriseCtrl.downloadRecording);
router.get('/analytics/calling-kpis', telephonyEnterpriseCtrl.getCallingKpis);

// Additive Android Companion Application Endpoints
router.post('/companion/register', companionCtrl.registerDevice);
router.post('/companion/upload', upload.single('recordingFile'), companionCtrl.uploadRecording);

module.exports = router;
