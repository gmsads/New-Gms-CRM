const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/timeline.controller');
const { protect, authorize } = require('../../guards/auth.guard');

// Employee Workday Session & Adaptive Ping Routes (Protected for all logged in employees)
router.post('/workday/login', protect, ctrl.startWorkdaySession);
router.post('/workday/logout', protect, ctrl.endWorkdaySession);
router.post('/workday/ping', protect, ctrl.recordWorkdayPing);

// Admin / Management Workforce Intelligence Dashboard & Reports Routes
router.get(
  '/live-status',
  protect,
  authorize('ADMIN', 'MD_CEO', 'COO', 'BRANCH_HEAD', 'BRANCH_MANAGER', 'OPERATION_MANAGER', 'HR'),
  ctrl.getLiveStatus
);

router.get(
  '/employee/:userId/daily',
  protect,
  authorize('ADMIN', 'MD_CEO', 'COO', 'BRANCH_HEAD', 'BRANCH_MANAGER', 'OPERATION_MANAGER', 'HR', 'FIELD_EXEC', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'SALES_EXEC'),
  ctrl.getEmployeeDailyTimeline
);

router.get(
  '/playback/:userId',
  protect,
  authorize('ADMIN', 'MD_CEO', 'COO', 'BRANCH_HEAD', 'BRANCH_MANAGER', 'OPERATION_MANAGER', 'HR'),
  ctrl.getRoutePlayback
);

router.get(
  '/reports/:reportType',
  protect,
  authorize('ADMIN', 'MD_CEO', 'COO', 'BRANCH_HEAD', 'BRANCH_MANAGER', 'OPERATION_MANAGER', 'HR'),
  ctrl.generateReports
);

module.exports = router;
