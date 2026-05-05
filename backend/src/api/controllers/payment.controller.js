const Payment = require('../../domains/payments/payment.model');
const { recordPayment, verifyPayment, rejectPayment } = require('../../workflows/payment.workflow');

// ── GET /api/payments ─────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { status, orderId, collectedBy } = req.query;
    const filter = {};

    if (status)      filter.status      = status;
    if (orderId)     filter.order       = orderId;
    if (collectedBy) filter.collectedBy = collectedBy;

    // Sales exec sees only their own payments
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.collectedBy = req.user._id;
    }

    const payments = await Payment.find(filter)
      .populate('order', 'orderNumber clientSnapshot grandTotal status')
      .populate('collectedBy', 'name role')
      .populate('verifiedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/payments ────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { payment, order } = await recordPayment(req.body, req.user);
    res.status(201).json({
      success: true,
      message: `Payment ${payment.paymentNumber} recorded. Awaiting manager verification.`,
      data: { payment, order },
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }
};

// ── POST /api/payments/:id/verify ─────────────────────────────────────────────
exports.verify = async (req, res) => {
  try {
    const { payment, order } = await verifyPayment(req.params.id, req.user);
    res.json({
      success: true,
      message: `Payment ${payment.paymentNumber} verified successfully.`,
      data: { payment, order },
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }
};

// ── POST /api/payments/:id/reject ─────────────────────────────────────────────
exports.reject = async (req, res) => {
  try {
    const { rejectionNote } = req.body;
    const { payment, order } = await rejectPayment(req.params.id, rejectionNote, req.user);
    res.json({
      success: true,
      message: `Payment ${payment.paymentNumber} rejected.`,
      data: { payment, order },
    });
  } catch (err) {
    res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
    });
  }
};

// ── GET /api/payments/:id ─────────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('order', 'orderNumber clientSnapshot grandTotal status')
      .populate('collectedBy', 'name role phone')
      .populate('verifiedBy', 'name role');

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    res.json({ success: true, data: payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/payments/pending ─────────────────────────────────────────────────
exports.pendingVerification = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'Pending' })
      .populate('order', 'orderNumber clientSnapshot grandTotal')
      .populate('collectedBy', 'name role')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: payments.length, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
