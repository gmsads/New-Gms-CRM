const Order          = require('../../domains/orders/order.model');
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
      filter.salesExec = req.user._id;
    } else if (salesExec) {
      filter.salesExec = salesExec;
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

    // Snapshot client info for history
    if (!order.clientSnapshot?.name && body.clientName) {
      order.clientSnapshot = {
        name:    body.clientName,
        phone:   body.clientPhone,
        company: body.clientCompany,
        email:   body.clientEmail,
      };
    }

    order.addTimelineEvent('Order Created', `Draft created by ${req.user.name}`, req.user);
    await order.save();

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
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
      filter.salesExec = req.user._id;
    }

    const [total, confirmed, inProduction, completed, cancelled, revenue] = await Promise.all([
      Order.countDocuments(filter),
      Order.countDocuments({ ...filter, status: 'Confirmed' }),
      Order.countDocuments({ ...filter, status: 'In_Production' }),
      Order.countDocuments({ ...filter, status: 'Completed' }),
      Order.countDocuments({ ...filter, status: 'Cancelled' }),
      Order.aggregate([
        { $match: { ...filter, paymentStatus: { $in: ['Partial', 'Paid'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPaid' }, totalGrandTotal: { $sum: '$grandTotal' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        total, confirmed, inProduction, completed, cancelled,
        totalRevenue: revenue[0]?.totalRevenue || 0,
        totalOrderValue: revenue[0]?.totalGrandTotal || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
