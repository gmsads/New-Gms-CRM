const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/quotation.controller');
const { protect } = require('../../guards/auth.guard');

router.use(protect);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.patch('/:id/status', ctrl.updateStatus);

module.exports = router;
