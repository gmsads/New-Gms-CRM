const express = require('express');
const router = express.Router();
const dailyWorkController = require('../controllers/dailyWork.controller');
const { protect, authorize } = require('../../guards/auth.guard');

// Route protected, authorization scoping is enforced inside the controller/service
router.get('/', protect, dailyWorkController.getEnterpriseDailyWork);

module.exports = router;
