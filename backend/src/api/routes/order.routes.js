const express = require('express');
const router  = express.Router();

const { protect }                   = require('../../guards/auth.guard');
const { can }                       = require('../../guards/role.guard');
const { enforceAdvanceThreshold }   = require('../../guards/payment.guard');
const {
  requireVerifiedPayment,
  requireDesignApproval,
  requireDeliveryProof,
  requireClientReview,
} = require('../../guards/delivery.guard');
const { validateOrderStatusMiddleware } = require('../../workflows/order.workflow');
const ctrl = require('../controllers/order.controller');

router.use(protect);

router.get('/',        can('orders:read'),   ctrl.list);
router.get('/search',  can('orders:read'),   ctrl.searchClient);
router.get('/stats',   can('orders:read'),   ctrl.stats);
router.get('/:id',     can('orders:read'),   ctrl.getOne);

router.post('/',       can('orders:create'), ctrl.create);

router.post('/:id/confirm',
  can('orders:create'),
  ctrl.confirm
);

router.post('/:id/approve-advance',
  can('orders:approve_low_advance'),
  ctrl.approveAdvance
);

router.patch('/:id/status',
  can('orders:update'),
  validateOrderStatusMiddleware,
  requireVerifiedPayment,
  requireDesignApproval,
  requireDeliveryProof,
  requireClientReview,
  ctrl.updateStatus
);

router.patch('/:id', can('orders:update'), ctrl.update);
router.post('/:id/payments', can('orders:update'), ctrl.addPayment);

module.exports = router;
