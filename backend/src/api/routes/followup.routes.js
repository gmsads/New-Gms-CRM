const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/followup.controller');

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.patch('/:id/complete', ctrl.complete);

module.exports = router;
