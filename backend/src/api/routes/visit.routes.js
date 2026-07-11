const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/visit.controller');
const { protect, authorize } = require('../../guards/auth.guard');

// Specific routes before generic /:id routes
router.get(
  '/daily-reports',
  protect,
  authorize('ADMIN', 'MD_CEO', 'COO', 'BRANCH_HEAD', 'BRANCH_MANAGER', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'OPERATION_MANAGER', 'HR'),
  ctrl.getDailyReports
);
router.post('/location-ping', protect, ctrl.recordLocationPing);
router.get('/location-pings', protect, authorize('ADMIN', 'MD_CEO', 'COO', 'BRANCH_HEAD', 'BRANCH_MANAGER', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'OPERATION_MANAGER', 'HR'), ctrl.getLocationPings);

// Base and ID routes require authentication
router.use(protect);
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.patch('/:id/check-in', ctrl.checkIn);
router.patch('/:id/check-out', ctrl.checkOut);

module.exports = router;
