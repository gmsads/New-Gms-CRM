/**
 * delivery.guard.js
 * Business rule enforcement for service delivery / BTL execution.
 *
 * Rules:
 * 1. Service cannot start unless payment is verified (min advance)
 * 2. Design must be approved before production starts
 * 3. Delivery proof is mandatory before marking as delivered
 * 4. Client review must be captured before marking as Completed
 */

const Order = require('../domains/orders/order.model');

// ─── Rule 1: Payment verified before service start ───────────────────────────
/**
 * Middleware: Prevents moving order to In_Production unless advance is verified.
 * Attach to: PATCH /orders/:id/status when status = 'In_Production'
 */
const requireVerifiedPayment = async (req, res, next) => {
  try {
    const order = req.resource || await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const targetStatus = req.body.status;
    const productionStatuses = ['In_Production', 'Ready_To_Deliver', 'Delivered'];

    if (productionStatuses.includes(targetStatus)) {
      if (order.paymentStatus === 'Unpaid') {
        return res.status(422).json({
          message: 'Service cannot start. No verified payment on record.',
          code: 'NO_PAYMENT_VERIFIED',
          orderId: order._id,
          paymentStatus: order.paymentStatus,
        });
      }

      // Check at least one verified payment exists
      const hasVerifiedPayment = order.paymentRecords.some(p => p.status === 'Verified');
      if (!hasVerifiedPayment) {
        return res.status(422).json({
          message: 'Service cannot start. Advance payment must be verified by a manager first.',
          code: 'PAYMENT_PENDING_VERIFICATION',
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

// ─── Rule 2: Design must be approved before production ───────────────────────
/**
 * Middleware: If order requires design, design must be Approved before In_Production.
 */
const requireDesignApproval = async (req, res, next) => {
  try {
    const order = req.resource || await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const targetStatus = req.body.status;
    if (targetStatus === 'In_Production') {
      if (order.designRequired && order.designStatus !== 'Approved' && order.designStatus !== 'Completed') {
        return res.status(422).json({
          message: 'Production cannot start. Design must be approved by Sales Manager before proceeding.',
          code: 'DESIGN_NOT_APPROVED',
          designStatus: order.designStatus,
          orderId: order._id,
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

// ─── Rule 3: Delivery proof required before marking Delivered ─────────────────
/**
 * Middleware: Blocks status → Delivered unless deliveryProofUrl is provided.
 */
const requireDeliveryProof = (req, res, next) => {
  const targetStatus = req.body.status;
  if (targetStatus === 'Delivered') {
    const { deliveryProofUrl } = req.body;
    if (!deliveryProofUrl || deliveryProofUrl.trim() === '') {
      return res.status(422).json({
        message: 'Delivery proof (photo/document) is required before marking order as Delivered.',
        code: 'DELIVERY_PROOF_REQUIRED',
        field: 'deliveryProofUrl',
      });
    }
  }
  next();
};

// ─── Rule 4: Client review required before Completed ─────────────────────────
/**
 * Middleware: Blocks status → Completed unless clientReview is provided.
 */
const requireClientReview = (req, res, next) => {
  const targetStatus = req.body.status;
  if (targetStatus === 'Completed') {
    const { clientReview, clientRating } = req.body;
    if (!clientReview || clientReview.trim() === '') {
      return res.status(422).json({
        message: 'Client review/feedback must be captured before marking order as Completed.',
        code: 'CLIENT_REVIEW_REQUIRED',
        field: 'clientReview',
      });
    }
    if (!clientRating || clientRating < 1 || clientRating > 5) {
      return res.status(422).json({
        message: 'Client rating (1–5) is required before completing the order.',
        code: 'CLIENT_RATING_REQUIRED',
        field: 'clientRating',
      });
    }
  }
  next();
};

// ─── Rule 5: Full payment required for Completed ──────────────────────────────
const requireFullPayment = async (req, res, next) => {
  try {
    const targetStatus = req.body.status;
    if (targetStatus === 'Completed') {
      const order = req.resource || await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found.' });

      if (order.balanceDue > 0) {
        return res.status(422).json({
          message: `Order cannot be completed. Balance due: ₹${order.balanceDue.toFixed(0)}. Collect remaining payment first.`,
          code: 'BALANCE_DUE',
          balanceDue: order.balanceDue,
          grandTotal: order.grandTotal,
          totalPaid: order.totalPaid,
        });
      }
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireVerifiedPayment,
  requireDesignApproval,
  requireDeliveryProof,
  requireClientReview,
  requireFullPayment,
};
