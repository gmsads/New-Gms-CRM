const express = require('express');
const router = express.Router();
const Quotation = require('../../domains/sales/quotations/quotation.model');
const { protect } = require('../../guards/auth.guard');
const { can } = require('../../guards/role.guard');
const templateCtrl = require('../controllers/template.controller');
const quotationCtrl = require('../controllers/quotation.controller');

router.use(protect);

// Template Routes
router.get('/template', templateCtrl.getTemplate);
router.put('/template', can('admin:full'), templateCtrl.updateTemplate);
router.post('/template', can('admin:full'), templateCtrl.updateTemplate);

const idempotency = require('../middlewares/idempotency');

// Quotation Routes
router.get('/', quotationCtrl.list);
router.post('/', idempotency, quotationCtrl.create);
router.put('/:id', quotationCtrl.update);
router.patch('/:id', quotationCtrl.update);
router.patch('/:id/status', quotationCtrl.updateStatus);

module.exports = router;
