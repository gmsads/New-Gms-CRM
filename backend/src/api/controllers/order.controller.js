const mongoose       = require('mongoose');
const Order          = require('../../domains/orders/order.model');
const User           = require('../../domains/users/user.model');
const OrderApproval = require('../../domains/approvals/approval.model');
const { confirmOrder, updateOrderStatus } = require('../../workflows/order.workflow');
const { createAuditLog } = require('../../guards/audit.helper');

// ── GET /api/orders ───────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { status, salesExec, paymentStatus, designStatus, search } = req.query;
    const filter = {};

    if (status)        filter.status        = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (designStatus)  filter.designStatus  = designStatus;

    // Sales exec only sees their own orders
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.salesExec = new mongoose.Types.ObjectId(req.user._id);
    } else if (salesExec) {
      filter.salesExec = new mongoose.Types.ObjectId(salesExec);
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'clientSnapshot.name': { $regex: search, $options: 'i' } },
        { 'clientSnapshot.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(filter)
      .populate('salesExec', 'name email role')
      .populate('salesManager', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/search ────────────────────────────────────────────────────
exports.searchClient = async (req, res) => {
  try {
    const { phone, company } = req.query;
    if (!phone && !company) return res.status(400).json({ success: false, message: 'Phone or Business Name is required' });

    const conditions = [];
    if (phone) conditions.push({ 'clientSnapshot.phone': phone });
    if (company) conditions.push({ 'clientSnapshot.company': { $regex: new RegExp(`^${company}$`, 'i') } });

    const filter = { $or: conditions };

    if (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.salesExec = req.user._id;
    }

    const order = await Order.findOne(filter)
      .populate('salesExec', 'name email role')
      .lean();

    if (!order) return res.json({ success: true, found: false });
    res.json({ success: true, found: true, data: { ...order.clientSnapshot, clientType: order.orderType } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('salesExec', 'name email role phone')
      .populate('salesManager', 'name email phone')
      .populate('operationsExec', 'name email')
      .populate('designAssignedTo', 'name email')
      .populate('prospect', 'name phone company stage')
      .populate('quotation', 'quotationNumber grandTotal status');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/orders ──────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const body = req.body;

    const order = new Order({
      ...body,
      salesExec: req.user._id,
      status:    'Draft',
    });

    // Handle initial payment if provided
    if (body.initialPayment && body.initialPayment.amount > 0) {
      order.paymentRecords.push({
        amount: body.initialPayment.amount,
        method: body.initialPayment.method || 'Cash',
        proofUrl: body.initialPayment.proofUrl,
        receivedBy: req.user._id,
        status: 'Pending'
      });
      order.addTimelineEvent('Payment Proof Uploaded', `Advance payment proof of ₹${body.initialPayment.amount} uploaded.`, req.user);
    }
    // Map design status from frontend
    if (body.designStatus === 'Need Design') {
      order.designRequired = true;
      order.designStatus   = 'Pending';
    } else if (body.designStatus === 'Design Provided') {
      order.designRequired = false; // or true if we still track it
      order.designStatus   = 'Not_Required';
    }

    // Snapshot client info
    if (!order.clientSnapshot?.name) {
      order.clientSnapshot = {
        name:    body.name || body.clientName || 'Unknown',
        phone:   body.phone || body.clientPhone || '',
        company: body.company || body.clientCompany || '',
        email:   body.email || body.clientEmail || '',
      };
    }

    order.addTimelineEvent('Order Created', `Draft created by ${req.user.name}`, req.user);

    // Initial save to compute totals (via pre-save hook) and generate orderNumber
    await order.save();

    // Now that totals are computed, check advance payment threshold (50%)
    const totalPayments = order.paymentRecords.reduce((sum, p) => sum + p.amount, 0);
    const advancePct    = order.grandTotal > 0 ? (totalPayments / order.grandTotal) * 100 : 0;

    if (order.grandTotal > 0 && totalPayments < (order.grandTotal * 0.5)) {
      // Switch to Pending_Approval
      order.status = 'Pending_Approval';
      order.addTimelineEvent('Approval Requested', 'Order flagged for manager approval due to low advance payment.', req.user);
      
      // Save the updated status and timeline
      await order.save();

      // Create the approval tracking record
      await OrderApproval.create({
        order: order._id,
        orderNumber: order.orderNumber,
        requestedBy: req.user._id,
        clientName: order.clientSnapshot?.name || 'Unknown',
        grandTotal: order.grandTotal,
        advancePaid: totalPayments,
        advancePct: parseFloat(advancePct.toFixed(2)),
        status: 'Pending'
      });
    }

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error('[ORDER_CREATE_ERROR]', err);
    
    // Check for Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: `Validation Failed: ${messages.join(', ')}`,
        errors: err.errors
      });
    }

    res.status(400).json({ 
      success: false, 
      message: err.message || 'Failed to create order',
      error: err.name,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ── POST /api/orders/:id/confirm ──────────────────────────────────────────────
exports.confirm = async (req, res) => {
  try {
    const order = await confirmOrder(req.params.id, req.user);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/status ──────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const order = await updateOrderStatus(req.params.id, req.body.status, req.user, req.body);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }
};

// ── PATCH /api/orders/:id ─────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (!['Draft', 'Pending_Approval'].includes(order.status)) {
      return res.status(422).json({
        success: false,
        message: 'Only Draft or Pending orders can be edited.',
      });
    }

    Object.assign(order, req.body);
    order.addTimelineEvent('Order Updated', `Updated by ${req.user.name}`, req.user);
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── POST /api/orders/:id/approve-advance ──────────────────────────────────────
exports.approveAdvance = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.advanceApproved   = true;
    order.advanceApprovedBy = req.user._id;

    if (order.status === 'Pending_Approval') {
      order.status = 'Confirmed';
      if (order.designRequired) {
        order.status       = 'Design_Pending';
        order.designStatus = 'Pending';
        order.designRequestedAt = new Date();
      }
    }

    order.addTimelineEvent(
      'Low Advance Approved',
      `Advance exception approved by ${req.user.name} (${req.user.role})`,
      req.user
    );

    await order.save();

    await createAuditLog({
      action: 'ADVANCE_EXCEPTION_APPROVED',
      performedBy: req.user,
      newValue: { orderId: order._id, orderNumber: order.orderNumber },
      req,
    });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/stats ─────────────────────────────────────────────────────
exports.stats = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.salesExec = new mongoose.Types.ObjectId(req.user._id);
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, confirmed, inProduction, completed, cancelled, revenue, user, monthlyTotal, monthlyCompleted] = await Promise.all([
      Order.countDocuments(filter),
      Order.countDocuments({ ...filter, status: 'Confirmed' }),
      Order.countDocuments({ ...filter, status: 'In_Production' }),
      Order.countDocuments({ ...filter, status: 'Completed' }),
      Order.countDocuments({ ...filter, status: 'Cancelled' }),
      Order.aggregate([
        { $match: { ...filter, paymentStatus: { $in: ['Partial', 'Paid'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPaid' }, totalGrandTotal: { $sum: '$grandTotal' } } },
      ]),
      User.findById(req.user._id).select('monthlyTarget targetMonth'),
      Order.countDocuments({ ...filter, createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ ...filter, status: 'Completed', updatedAt: { $gte: startOfMonth } }),
    ]);

    console.log('[DEBUG_STATS] UserID:', req.user._id, 'FoundTarget:', user?.monthlyTarget);

    res.json({
      success: true,
      data: {
        total, confirmed, inProduction, completed, cancelled,
        totalRevenue: revenue[0]?.totalRevenue || 0,
        totalOrderValue: revenue[0]?.totalGrandTotal || 0,
        monthlyTarget: Number(user?.monthlyTarget || 0),
        targetMonth: user?.targetMonth,
        monthlyTotal,
        monthlyCompleted,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// ── POST /api/orders/:id/payments ───────────────────────────────────────────
const { recordPayment } = require('../../workflows/payment.workflow');

exports.addPayment = async (req, res) => {
  try {
    const { amount, method, proofUrl, proofType, reference, paymentType, notes } = req.body;
    
    const { payment, order } = await recordPayment({
      orderId: req.params.id,
      amount,
      method,
      proofUrl,
      proofType,
      reference,
      paymentType,
      notes
    }, req.user);

    res.status(201).json({
      success: true,
      message: 'Payment recorded and awaiting verification.',
      data: { payment, order }
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
