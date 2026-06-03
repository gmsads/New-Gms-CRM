const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../guards/auth.guard');
const performanceController = require('../controllers/performance.controller');

// All performance configuration routes require ADMIN role (or HR for reviews)
router.use(protect);

// --- KPI Configuration Routes ---
router.route('/admin/kpi-config')
  .get(authorize('ADMIN', 'HR', 'MD_CEO'), performanceController.getKpiConfigs)
  .post(authorize('ADMIN', 'HR'), performanceController.createKpiConfig);

router.route('/admin/kpi-config/:id')
  .put(authorize('ADMIN', 'HR'), performanceController.updateKpiConfig)
  .delete(authorize('ADMIN', 'HR'), performanceController.deleteKpiConfig);

// --- Incentive Rule Routes ---
router.route('/admin/incentives')
  .get(authorize('ADMIN', 'HR', 'MD_CEO'), performanceController.getIncentiveRules)
  .post(authorize('ADMIN', 'HR'), performanceController.createIncentiveRule);

router.route('/admin/incentives/:id')
  .put(authorize('ADMIN', 'HR'), performanceController.updateIncentiveRule)
  .delete(authorize('ADMIN', 'HR'), performanceController.deleteIncentiveRule);

// --- Engine Routes ---
router.get('/engine/ips', performanceController.getIndividualPerformance);
router.get('/engine/tps', authorize('ADMIN', 'BRANCH_HEAD', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'HR'), performanceController.getTeamPerformance);
router.get('/engine/bottlenecks', authorize('ADMIN', 'BRANCH_HEAD', 'MD_CEO', 'COO'), performanceController.getBottlenecks);
router.get('/engine/insights', performanceController.getAiInsights);
router.get('/engine/health', authorize('ADMIN', 'HR', 'BRANCH_HEAD', 'MD_CEO', 'COO'), performanceController.getEmployeeHealth);

module.exports = router;
