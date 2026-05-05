const express = require('express');
const router = express.Router();
const c = require('../controllers/attendance.controller');
const { protect, hrOnly } = require('../../guards/auth.guard');

router.use(protect);
router.post('/', hrOnly, c.markAttendance);
router.get('/', hrOnly, c.getAttendance);
router.get('/report', hrOnly, c.getReport);
router.put('/:id', hrOnly, c.editAttendance);

module.exports = router;
