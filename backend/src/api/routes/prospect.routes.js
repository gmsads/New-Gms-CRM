const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/prospect.controller');

router.get('/', ctrl.list);
router.get('/search', ctrl.searchByPhone);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.patch('/:id/stage', ctrl.updateStage);
router.delete('/:id', ctrl.remove);

module.exports = router;
