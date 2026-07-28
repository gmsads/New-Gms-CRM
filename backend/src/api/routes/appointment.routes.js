// Routes for Appointments
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { protect, authorize } = require('../../guards/auth.guard');
const idempotency = require('../middlewares/idempotency');

router.use(protect);

router.get('/stats', appointmentController.getStats);

// Only management and non-field execs can create
const canManageAppts = authorize('ADMIN', 'MD_CEO', 'BRANCH_HEAD', 'COO', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'SR_SALES_EXEC', 'SALES_EXEC');

// Only management can assign
const canAssignAppts = authorize('ADMIN', 'MD_CEO', 'BRANCH_HEAD', 'COO', 'SALES_MANAGER', 'SR_SALES_MANAGER');

router.route('/')
  .get(appointmentController.list)
  .post(canManageAppts, idempotency, appointmentController.create);

router.patch('/:id/assign', canAssignAppts, appointmentController.assign);
router.patch('/:id/reschedule', canManageAppts, appointmentController.reschedule);
router.patch('/:id/status', appointmentController.updateStatus);
router.post('/:id/remarks', appointmentController.addRemark);
router.get('/:id/timeline', appointmentController.getTimeline);

module.exports = router;
