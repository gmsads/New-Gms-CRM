const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity.controller');
const { protect } = require('../../guards/auth.guard');

router.use(protect);

// GET /api/activities
router.get('/', activityController.getFeed);

module.exports = router;
