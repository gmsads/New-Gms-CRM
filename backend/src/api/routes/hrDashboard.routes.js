const express = require('express');
const router = express.Router();
const c = require('../controllers/hrDashboard.controller');
const { protect, hrOnly } = require('../../guards/auth.guard');

router.use(protect);
router.use(hrOnly);

router.get('/stats', c.getDashboardStats);

module.exports = router;
