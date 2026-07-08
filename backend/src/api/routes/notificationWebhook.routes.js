/**
 * notificationWebhook.routes.js
 * Routes for incoming WhatsApp webhook notifications from Meta Cloud API.
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationWebhook.controller');

router.get('/whatsapp', controller.verifyWebhook);
router.post('/whatsapp', controller.handleIncoming);

module.exports = router;
