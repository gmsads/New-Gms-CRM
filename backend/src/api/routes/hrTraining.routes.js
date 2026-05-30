const express = require('express');
const router = express.Router();
const c = require('../controllers/hrTraining.controller');
const { protect, hrOnly } = require('../../guards/auth.guard');

router.use(protect);
router.use(hrOnly);

router.get('/', c.getTrainings);
router.post('/', c.createTraining);
router.put('/:id', c.updateTraining);
router.delete('/:id', c.deleteTraining);

module.exports = router;
