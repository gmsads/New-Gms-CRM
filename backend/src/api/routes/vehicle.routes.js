const express = require('express');
const router = express.Router();
const Vehicle = require('../../domains/service/models/vehicle.model');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/', protect, authorize('SERVICE_MANAGER', 'ADMIN', 'MD_CEO'), async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, authorize('SERVICE_MANAGER', 'ADMIN', 'MD_CEO'), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.create({
      ...req.body,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', protect, authorize('SERVICE_MANAGER', 'ADMIN', 'MD_CEO'), async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
