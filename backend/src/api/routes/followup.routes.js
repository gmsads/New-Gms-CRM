const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/followup.controller');
const { protect } = require('../../guards/auth.guard');

router.use(protect);

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:id/complete', ctrl.complete);

module.exports = router;
