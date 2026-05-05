const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/visit.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.patch('/:id/check-in', ctrl.checkIn);
router.patch('/:id/check-out', ctrl.checkOut);

module.exports = router;
