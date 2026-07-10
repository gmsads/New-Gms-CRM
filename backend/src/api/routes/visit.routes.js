const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/visit.controller');

// Specific routes before generic /:id routes
router.get('/daily-reports', ctrl.getDailyReports);
router.post('/location-ping', ctrl.recordLocationPing);
router.get('/location-pings', ctrl.getLocationPings);

// Base and ID routes
router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.patch('/:id/check-in', ctrl.checkIn);
router.patch('/:id/check-out', ctrl.checkOut);

module.exports = router;
