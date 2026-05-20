const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/brochure.controller');
const { protect } = require('../../guards/auth.guard');

router.use(protect);

router.get('/', ctrl.list);
router.get('/categories', ctrl.listCategories);
router.get('/history', ctrl.history);
router.post('/', ctrl.create);
router.patch('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/send', ctrl.send);

module.exports = router;
