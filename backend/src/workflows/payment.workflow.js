/**
 * payment.workflow.js
 * Orchestrates payment collection → verification → order status update.
 *
 * Flow:
 *  1. Sales Exec records payment + uploads proof  → status: Pending
 *  2. Manager/Admin verifies → status: Verified
 *     → Order paymentRecords updated
 *     → Order paymentStatus recalculated
 *     → If fully paid → timeline event
 *  3. Manager rejects → status: Rejected (with note)
 *     → Sales Exec must re-upload
 */

const Payment  = require('../domains/payments/payment.model');
const Order    = require('../domains/orders/order.model');

// ─── Step 1: Record a payment ─────────────────────────────────────────────────
/**
 * recordPayment
 * Called by Sales Exec after receiving cash/UPI/bank transfer.
 *
 * @param {Object} data - { orderId, amount, method, proofUrl, proofType, reference, paymentType, notes }
 * @param {Object} user - req.user
 */
const recordPayment = async (data, user) => {
  const { orderId, amount, method, proofUrl, proofType, reference, paymentType, notes } = data;

  // Load order
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });

  // Business rule: cannot record on cancelled/completed
  const blockedStatuses = ['Cancelled', 'Completed'];
  if (blockedStatuses.includes(order.status)) {
    throw Object.assign(
      new Error(`Cannot record payment. Order status is: ${order.status}`),
      { statusCode: 422 }
    );
  }

  // Create Payment document
  const payment = await Payment.create({
    order:       orderId,
    prospect:    order.prospect,
    client:      order.client,
    amount:      Number(amount),
    method,
    reference,
    proofUrl,
    proofType,
    paymentType: paymentType || (order.advancePaid === 0 ? 'Advance' : 'Partial'),
    collectedBy: user._id,
    collectedAt: new Date(),
    notes,
    status: 'Pending',
  });

  // Add pending record to order (status = Pending, not counted yet)
  order.paymentRecords.push({
    amount,
    method,
    proofUrl,
    receivedAt:  new Date(),
    receivedBy:  user._id,
    paymentId:   payment._id,
    status:      'Pending',
  });

  order.addTimelineEvent(
    'Payment Recorded',
    `₹${amount} via ${method} — awaiting manager verification. Payment ID: ${payment.paymentNumber}`,
    user
  );

  await order.save();

  return { payment, order };
};

// ─── Step 2: Verify a payment ─────────────────────────────────────────────────
/**
 * verifyPayment
 * Called by Sales Manager / Admin.
 *
 * @param {string} paymentId
 * @param {Object} user - req.user (verifier)
 */
const verifyPayment = async (paymentId, user) => {
  const payment = await Payment.findById(paymentId).populate('order');
  if (!payment) throw Object.assign(new Error('Payment not found.'), { statusCode: 404 });

  if (payment.status !== 'Pending') {
    throw Object.assign(
      new Error(`Payment is already ${payment.status}. Cannot re-verify.`),
      { statusCode: 422 }
    );
  }

  // Conflict of interest check
  if (payment.collectedBy.toString() === user._id.toString()) {
    throw Object.assign(
      new Error('You cannot verify a payment you collected.'),
      { statusCode: 403, code: 'SELF_VERIFICATION_BLOCKED' }
    );
  }

  // Mark payment as verified
  payment.status     = 'Verified';
  payment.verifiedBy = user._id;
  payment.verifiedAt = new Date();
  await payment.save();

  const order = await Order.findById(payment.order._id || payment.order);
  if (order) {
    const record = order.paymentRecords.find(
      p => p.paymentId?.toString() === payment._id.toString()
    );
    if (record) {
      record.status     = 'Verified';
      record.verifiedBy = user._id;
      record.verifiedAt = new Date();
    }

    order.addTimelineEvent(
      'Payment Verified',
      `₹${payment.amount} via ${payment.method} verified by ${user.name}. Payment ID: ${payment.paymentNumber}`,
      user
    );

    // If order was pending approval and advance now sufficient → confirm it
    if (order.status === 'Pending_Approval') {
      const verifiedTotal = order.paymentRecords
        .filter(p => p.status === 'Verified')
        .reduce((s, p) => s + p.amount, 0);

      if (verifiedTotal >= order.grandTotal * 0.5) {
        order.status = 'Confirmed';
        order.addTimelineEvent('Order Confirmed', 'Advance threshold met after payment verification.', user);

        if (order.designRequired) {
          order.status       = 'Design_Pending';
          order.designStatus = 'Pending';
          order.designRequestedAt = new Date();
          order.addTimelineEvent('Design Request Created', 'Design workflow triggered automatically.', user);
        }
      }
    }

    await order.save();
  }

  return { payment, order };
};

// ─── Step 3: Reject a payment ─────────────────────────────────────────────────
/**
 * rejectPayment
 * Called by Sales Manager / Admin when proof is invalid.
 *
 * @param {string} paymentId
 * @param {string} rejectionNote
 * @param {Object} user
 */
const rejectPayment = async (paymentId, rejectionNote, user) => {
  const payment = await Payment.findById(paymentId).populate('order');
  if (!payment) throw Object.assign(new Error('Payment not found.'), { statusCode: 404 });

  if (payment.status !== 'Pending') {
    throw Object.assign(new Error(`Payment is already ${payment.status}.`), { statusCode: 422 });
  }

  payment.status        = 'Rejected';
  payment.verifiedBy    = user._id;
  payment.verifiedAt    = new Date();
  payment.rejectionNote = rejectionNote || 'Proof invalid or unclear.';
  await payment.save();

  // Update embedded record in order
  const order = await Order.findById(payment.order._id || payment.order);
  if (order) {
    const record = order.paymentRecords.find(
      p => p.paymentId?.toString() === payment._id.toString()
    );
    if (record) record.status = 'Rejected';

    order.addTimelineEvent(
      'Payment Rejected',
      `₹${payment.amount} rejected by ${user.name}. Reason: ${payment.rejectionNote}`,
      user
    );

    await order.save();
  }

  return { payment, order };
};

module.exports = { recordPayment, verifyPayment, rejectPayment };
