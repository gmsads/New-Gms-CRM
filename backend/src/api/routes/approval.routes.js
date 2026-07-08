const express = require('express');
const router = express.Router();
const c = require('../controllers/approval.controller');
const { protect, managerOnly } = require('../../guards/auth.guard');

router.use(protect);
router.get('/', c.list);
router.get('/stats', c.getStats);
router.post('/:id/approve', managerOnly, c.approve);
router.post('/:id/reject', managerOnly, c.reject);

module.exports = router;
