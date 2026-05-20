// Routes for Appointments
const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { protect } = require('../../guards/auth.guard');

router.use(protect);

router.get('/stats', appointmentController.getStats);

const idempotency = require('../middlewares/idempotency');

router.route('/')
  .get(appointmentController.list)
  .post(idempotency, appointmentController.create);


router.patch('/:id/assign', appointmentController.assign);
router.patch('/:id/status', appointmentController.updateStatus);
router.post('/:id/remarks', appointmentController.addRemark);
router.get('/:id/timeline', appointmentController.getTimeline);

module.exports = router;
