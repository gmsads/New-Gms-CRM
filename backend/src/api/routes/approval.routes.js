const express = require('express');
const router = express.Router();
const c = require('../controllers/approval.controller');
const { protect, adminOnly, hrOnly } = require('../../guards/auth.guard');

router.use(protect);
router.get('/', adminOnly, c.getApprovals);
router.post('/:id/approve', adminOnly, c.approveRequest);
router.post('/:id/reject', adminOnly, c.rejectRequest);
router.post('/:id/revise', adminOnly, c.reviseRequest);
router.post('/:id/resubmit', hrOnly, c.resubmitRequest);

module.exports = router;
