const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integration.controller');
const { protect } = require('../../guards/auth.guard');

router.use(protect);

router.get('/', integrationController.getIntegrations);
router.post('/toggle', integrationController.toggleIntegration);
router.post('/connect', integrationController.connectIntegration);

module.exports = router;
