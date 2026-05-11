const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/prospect.controller');
const { protect } = require('../../guards/auth.guard');

router.use(protect);

router.get('/', ctrl.list);
router.get('/stats', ctrl.stats);
router.get('/search', ctrl.searchByPhone);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.patch('/:id/stage', ctrl.updateStage);
router.delete('/:id', ctrl.remove);

module.exports = router;
