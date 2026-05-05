const express = require('express');
const router = express.Router();
const c = require('../controllers/leave.controller');
const { protect, hrOnly, adminOnly } = require('../../guards/auth.guard');

router.use(protect);
router.post('/', c.submitLeave);           // any active employee
router.get('/', c.getLeaves);              // filtered per role in controller
router.put('/:id/hr-review', hrOnly, c.hrReviewLeave);
router.put('/:id/admin-override', adminOnly, c.adminOverrideLeave);

module.exports = router;
