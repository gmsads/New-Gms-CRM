const express = require('express');
const router = express.Router();
const Labour = require('../../domains/service/models/labour.model');
const { protect, authorize } = require('../middlewares/auth.middleware');

router.get('/', protect, authorize('SERVICE_MANAGER', 'ADMIN', 'MD_CEO'), async (req, res, next) => {
  try {
    const labour = await Labour.find().sort({ createdAt: -1 });
    res.json({ success: true, data: labour });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, authorize('SERVICE_MANAGER', 'ADMIN', 'MD_CEO'), async (req, res, next) => {
  try {
    const labour = await Labour.create({
      ...req.body,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: labour });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', protect, authorize('SERVICE_MANAGER', 'ADMIN', 'MD_CEO'), async (req, res, next) => {
  try {
    const labour = await Labour.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, data: labour });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
