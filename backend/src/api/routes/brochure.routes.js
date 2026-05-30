const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/brochure.controller');
const { protect } = require('../../guards/auth.guard');
const upload = require('../../core/middlewares/upload.middleware');

router.use(protect);

router.get('/', ctrl.list);
router.get('/categories', ctrl.listCategories);
router.get('/history', ctrl.history);
router.post('/', upload.fields([{ name: 'brochure', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), ctrl.create);
router.patch('/:id', upload.fields([{ name: 'brochure', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/send', ctrl.send);

module.exports = router;
