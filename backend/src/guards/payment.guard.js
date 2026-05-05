/**
 * payment.guard.js
 * Business rule enforcement for payment operations.
 *
 * Rules:
 * 1. Proof is mandatory — no proof URL = block
 * 2. Advance must be ≥ 50% of grand total (or admin approval required)
 * 3. Cannot verify own payment (conflict of interest)
 * 4. Cannot record payment on cancelled / completed orders
 */

const Order = require('../domains/orders/order.model');

// ─── Rule 1: Proof is mandatory ───────────────────────────────────────────────
/**
 * Middleware: Blocks payment submission if proofUrl is missing.
 * In a real app this would check the multipart upload or the S3 URL.
 * For now checks the request body for proofUrl field.
 */
const requireProof = (req, res, next) => {
  const { proofUrl } = req.body;
  if (!proofUrl || proofUrl.trim() === '') {
    return res.status(422).json({
      message: 'Payment proof is mandatory. Please upload a screenshot or receipt.',
      field: 'proofUrl',
    });
  }
  next();
};

// ─── Rule 2: Advance threshold enforcement ────────────────────────────────────
/**
 * Middleware: Checks if advance payment meets the 50% threshold.
 * If not, blocks unless admin has pre-approved via order.advanceApproved flag.
 *
 * Attach this AFTER loading the order into req.resource.
 */
const enforceAdvanceThreshold = async (req, res, next) => {
  try {
    const orderId = req.body.order || req.params.orderId;
    if (!orderId) return next(); // no order context, skip

    const order = await Order.findById(orderId).select('grandTotal advancePaid advanceApproved status');
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    // ── Gate: Order must be in a payable status
    const nonPayableStatuses = ['Cancelled', 'Completed'];
    if (nonPayableStatuses.includes(order.status)) {
      return res.status(422).json({
        message: `Cannot record payment on an order with status: ${order.status}.`,
      });
    }

    const incomingAmount   = Number(req.body.amount) || 0;
    const projectedPaid    = order.advancePaid + incomingAmount;
    const requiredAdvance  = order.grandTotal * 0.5;
    const advancePct       = (projectedPaid / order.grandTotal) * 100;

    // Attach to req for downstream use
    req.paymentContext = {
      order,
      incomingAmount,
      projectedPaid,
      requiredAdvance,
      advancePct,
      meetsThreshold: projectedPaid >= requiredAdvance,
    };

    // ── If this is the first / advance payment and it's below 50%
    if (order.advancePaid === 0 && projectedPaid < requiredAdvance) {
      // Check admin pre-approval
      if (!order.advanceApproved) {
        return res.status(422).json({
          message: `Advance payment must be at least 50% (₹${requiredAdvance.toFixed(0)}) of the order value (₹${order.grandTotal.toFixed(0)}). Current: ${advancePct.toFixed(1)}%. Request admin approval to proceed below threshold.`,
          code: 'ADVANCE_BELOW_THRESHOLD',
          requiredAdvance,
          grandTotal: order.grandTotal,
          advancePct,
          orderId: order._id,
        });
      }
    }

    next();
  } catch (err) {
    next(err);
  }
};

// ─── Rule 3: No self-verification ────────────────────────────────────────────
/**
 * Middleware: The person who collected a payment cannot verify it.
 * req.payment must be loaded before this middleware.
 */
const preventSelfVerification = (req, res, next) => {
  const payment = req.resource || req.payment;
  if (!payment) return next();

  const collectorId = payment.collectedBy?.toString();
  const verifierId  = req.user?._id?.toString();

  if (collectorId && verifierId && collectorId === verifierId) {
    return res.status(403).json({
      message: 'Conflict of interest: You cannot verify a payment you collected. A manager must verify.',
    });
  }
  next();
};

// ─── Rule 4: Approve low advance (admin only) ─────────────────────────────────
/**
 * Sets order.advanceApproved = true.
 * Called from the order approval route — admin explicitly unlocking low advance.
 */
const approveAdvanceException = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.advanceApproved   = true;
    order.advanceApprovedBy = req.user._id;
    order.addTimelineEvent(
      'Advance Exception Approved',
      `Low advance approved by ${req.user.role}: ${req.user.name}`,
      req.user
    );
    await order.save();

    return res.json({
      success: true,
      message: 'Low advance exception approved. Order can now proceed.',
      orderId: order._id,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { requireProof, enforceAdvanceThreshold, preventSelfVerification, approveAdvanceException };
