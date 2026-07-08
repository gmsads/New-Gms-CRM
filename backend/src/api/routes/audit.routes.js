const express = require('express');
const router = express.Router();
const c = require('../controllers/audit.controller');
const { protect, adminOnly } = require('../../guards/auth.guard');

router.use(protect, adminOnly);
router.get('/', c.getAuditLogs);
router.get('/hr-activity', c.getHRActivityLogs);

module.exports = router;
