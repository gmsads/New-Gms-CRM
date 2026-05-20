const mongoose       = require('mongoose');
const Order          = require('../../domains/orders/order.model');
const Prospect       = require('../../domains/sales/prospects/prospect.model');
const User           = require('../../domains/users/user.model');
const OrderApproval = require('../../domains/approvals/approval.model');
const { createAuditLog } = require('../../guards/audit.helper');
const orderWorkflow = require('../../services/workflows/orderWorkflow.service');

const getReqContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  device: req.headers['user-agent']
});

// ── GET /api/orders ───────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { status, salesExec, paymentStatus, designStatus, search } = req.query;
    const filter = {};

    if (status)        filter.status        = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (designStatus)  filter.designStatus  = designStatus;

    // Role-based visibility
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.salesExec = new mongoose.Types.ObjectId(req.user._id);
    } else if (req.user.role === 'DESIGNER') {
      filter.$or = [
        { designAssignedTo: new mongoose.Types.ObjectId(req.user._id) },
        // Also allow viewing if they want to pick up unassigned work, but usually assigned via Round Robin
      ];
      // Designers shouldn't need to see orders that aren't design-related at all.
      filter.designRequired = true;
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

    let orders = await Order.find(filter)
      .populate('salesExec', 'name email role')
      .populate('salesManager', 'name email')
      .populate('designAssignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Sanitize financial data for Designers
    if (req.user.role === 'DESIGNER') {
      orders = orders.map(o => {
        delete o.grandTotal;
        delete o.subtotal;
        delete o.totalDiscount;
        delete o.totalPaid;
        delete o.balanceDue;
        delete o.paymentRecords;
        delete o.advanceRequired;
        delete o.advancePaid;
        return o;
      });
    }

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
    
    // Convert to plain object to allow deletion
    const orderObj = order.toObject ? order.toObject() : order;

    // Sanitize financial data for Designers
    if (req.user.role === 'DESIGNER') {
      delete orderObj.grandTotal;
      delete orderObj.subtotal;
      delete orderObj.totalDiscount;
      delete orderObj.totalPaid;
      delete orderObj.balanceDue;
      delete orderObj.paymentRecords;
      delete orderObj.advanceRequired;
      delete orderObj.advancePaid;
      if (orderObj.quotation) delete orderObj.quotation.grandTotal;
    }

    res.json({ success: true, data: orderObj });
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

    // Delegate to workflow to determine if it goes to Pending_Approval or Confirmed (and triggers RoundRobin)
    const confirmedOrder = await orderWorkflow.confirmOrder(order._id, req.user, getReqContext(req));

    res.status(201).json({ success: true, data: confirmedOrder });
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
    const order = await orderWorkflow.confirmOrder(req.params.id, req.user, getReqContext(req));
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/status ──────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const order = await orderWorkflow.updateOrderStatus(req.params.id, req.body.status, req.user, req.body, getReqContext(req));
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
    const order = await orderWorkflow.updateOrder(req.params.id, req.body, req.user, getReqContext(req));
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/line-items/:itemIndex ─────────────────────────────────
exports.updateLineItem = async (req, res) => {
  try {
    const { id, itemIndex } = req.params;
    const { designerStatus, designFileUrl, operationStatus, operationFileUrl, serviceStatus, serviceFileUrl } = req.body;
    
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (!order.lineItems || !order.lineItems[itemIndex]) {
      return res.status(404).json({ success: false, message: 'Line item not found.' });
    }
    
    const item = order.lineItems[itemIndex];
    if (designerStatus) item.designerStatus = designerStatus;
    if (designFileUrl) item.designFileUrl = designFileUrl;
    if (operationStatus) item.operationStatus = operationStatus;
    if (operationFileUrl) item.operationFileUrl = operationFileUrl;
    if (serviceStatus) item.serviceStatus = serviceStatus;
    if (serviceFileUrl) item.serviceFileUrl = serviceFileUrl;
    
    order.addTimelineEvent('Line Item Updated', `Updated product/service ${item.description}`, req.user);
    
    await order.save();

    // Check if all line items are completed by the service team
    const allCompleted = order.lineItems.every(li => li.serviceStatus === 'completed');
    if (allCompleted && order.status !== 'Completed') {
      const orderWorkflow = require('../../workflows/order.workflow');
      const getReqContext = (req) => ({
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        device: req.headers['user-agent']
      });
      // Force transition by mocking admin role, bypassing strict step-by-step validations
      const forceAdminUser = { _id: req.user._id, role: 'ADMIN', name: req.user.name };
      await orderWorkflow.updateOrderStatus(order._id, 'Completed', forceAdminUser, {}, getReqContext(req));
      const updatedOrder = await Order.findById(id);
      return res.json({ success: true, data: updatedOrder });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/orders/:id/approve-advance ──────────────────────────────────────
exports.approveAdvance = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.advanceApproved   = true;
    order.advanceApprovedBy = req.user._id;

    order.addTimelineEvent(
      'Low Advance Approved',
      `Advance exception approved by ${req.user.name} (${req.user.role})`,
      req.user
    );

    await order.save();
    
    // Call the workflow to officially transition the status and trigger RoundRobin
    const confirmedOrder = await orderWorkflow.confirmOrder(order._id, req.user, getReqContext(req));

    await createAuditLog({
      action: 'ADVANCE_EXCEPTION_APPROVED',
      performedBy: req.user,
      newValue: { orderId: order._id, orderNumber: order.orderNumber },
      req,
    });

    res.json({ success: true, data: confirmedOrder });
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
