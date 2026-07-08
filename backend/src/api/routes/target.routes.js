const express = require('express');
const router = express.Router();
const targetController = require('../controllers/target.controller');
const { protect } = require('../../guards/auth.guard');

// All target routes require authentication
router.use(protect);

// Analytics & Dashboard (Place specific routes before generic /:id routes)
router.get('/analytics', targetController.getAnalytics);

// Core CRUD
router.post('/', targetController.assignTarget);
router.get('/', targetController.listTargets);
router.patch('/:id', targetController.updateTarget);
router.patch('/:id/progress', targetController.updateProgress);

module.exports = router;
