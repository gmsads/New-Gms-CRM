const express = require('express');
const router = express.Router();
const c = require('../controllers/hrExit.controller');
const { protect, hrOnly } = require('../../guards/auth.guard');

router.use(protect);
router.use(hrOnly);

router.get('/', c.getExitProcesses);
router.post('/', c.createExitProcess);
router.put('/:id', c.updateExitProcess);
router.delete('/:id', c.deleteExitProcess);

module.exports = router;
