const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/analytics.controller');
const { protect } = require('../../guards/auth.guard');

router.get('/stats', protect, ctrl.getDashboardStats);

module.exports = router;
