const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { protect } = require('../../guards/auth.guard');

router.use(protect);

router.route('/')
  .get(appointmentController.list)
  .post(appointmentController.create);

router.get('/stats', appointmentController.getStats);


router.patch('/:id/assign', appointmentController.assign);
router.patch('/:id/remark', appointmentController.updateRemark);

module.exports = router;
