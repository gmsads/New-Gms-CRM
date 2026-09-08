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

const idempotency = require('../middlewares/idempotency');

router.post('/bulk', can('orders:create'), ctrl.bulkImport);
router.post('/', idempotency, can('orders:create'), ctrl.create);

router.post('/:id/confirm',
  idempotency,
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

const { selfOrManager } = require('../../guards/role.guard');
const Order = require('../../domains/orders/order.model');
const { getAccessibleUserIds } = require('../../utils/team.helper');

// Middleware to load order and verify ownership/team access
const loadAndVerifyOrderAccess = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    
    const accessibleIds = await getAccessibleUserIds(req.user);
    if (accessibleIds !== null) {
      // accessibleIds is an array of allowed user IDs for this user
      const orderOwnerId = order.salesExec?.toString();
      if (!accessibleIds.includes(orderOwnerId)) {
        return res.status(403).json({ message: 'Access denied. You do not have permission to modify this order.' });
      }
    }
    
    req.resource = order;
    next();
  } catch (err) {
    next(err);
  }
};

router.patch('/:id/line-items/:itemIndex', can('orders:update'), ctrl.updateLineItem);
router.delete('/:id/line-items/:itemIndex', can('orders:update'), ctrl.deleteLineItem);
router.patch('/:id', can('orders:update'), loadAndVerifyOrderAccess, ctrl.update);
router.delete('/:id', can('orders:delete'), loadAndVerifyOrderAccess, ctrl.deleteOrder);
router.post('/:id/payments', can('orders:update'), ctrl.addPayment);
router.post('/:id/verify', can('orders:update'), ctrl.verifyOrder);

module.exports = router;
