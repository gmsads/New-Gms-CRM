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
    const { status, salesExec, paymentStatus, designStatus, search, verificationStatus } = req.query;
    const filter = {};

    if (status)             filter.status             = status;
    if (paymentStatus)      filter.paymentStatus      = paymentStatus;
    if (designStatus)       filter.designStatus       = designStatus;
    if (verificationStatus) filter.verificationStatus = verificationStatus;

    // Role-based visibility
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'SR_SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.salesExec = new mongoose.Types.ObjectId(req.user._id);
      if (!status) {
        filter.status = { $ne: 'Pending_Approval' };
      }
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

    if (req.user.role === 'SALES_EXEC' || req.user.role === 'SR_SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
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
      .populate('operationsManager', 'name email')
      .populate('serviceManager', 'name email')
      .populate('prospect', 'name phone company stage')
      .populate('quotation', 'quotationId totalAmount status');

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
      if (orderObj.quotation) delete orderObj.quotation.totalAmount;
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

    // Intelligent Prospect Matching
    let prospectId = body.prospect;
    if (!prospectId) {
      const phone = body.phone || body.clientSnapshot?.phone;
      const email = body.email || body.clientSnapshot?.email;
      const gstNumber = body.gstNumber || body.clientSnapshot?.gstNumber;
      const company = body.company || body.clientSnapshot?.company;

      let matchedProspect = null;
      if (phone) {
        matchedProspect = await Prospect.findOne({ phone, 'softDelete.isDeleted': { $ne: true } });
      }
      if (!matchedProspect && email) {
        matchedProspect = await Prospect.findOne({ email, 'softDelete.isDeleted': { $ne: true } });
      }
      if (!matchedProspect && gstNumber) {
        matchedProspect = await Prospect.findOne({ gstNumber, 'softDelete.isDeleted': { $ne: true } });
      }
      if (!matchedProspect && company) {
        matchedProspect = await Prospect.findOne({ company: { $regex: new RegExp(`^${company}$`, 'i') }, 'softDelete.isDeleted': { $ne: true } });
      }

      if (matchedProspect) {
        prospectId = matchedProspect._id;
      }
    }

    const order = new Order({
      ...body,
      prospect: prospectId,
      salesExec: req.user._id,
      status:    'Draft',
    });

    // Map design status from frontend
    if (body.designStatus === 'Need Design') {
      order.designRequired = true;
      order.designStatus   = 'Pending';
      order.lineItems.forEach(item => {
        if (!item.designerWorkflow) item.designerWorkflow = {};
        item.designerWorkflow.workflowType = 'DESIGN_CREATED';
        item.designerWorkflow.currentStatus = 'Assigned';
      });
    } else if (body.designStatus === 'Design Provided') {
      order.designRequired = true; // Still required so it goes to designer for check
      order.designStatus   = 'Pending';
      
      order.lineItems.forEach((item, idx) => {
        if (!item.designerWorkflow) item.designerWorkflow = {};
        item.designerWorkflow.workflowType = 'CLIENT_UPLOADED';
        item.designerWorkflow.currentStatus = 'Assigned';
        
        // Attach the uploaded design file to the first line item
        if (idx === 0 && body.designFileUrl) {
          if (!item.serviceFiles) item.serviceFiles = [];
          item.serviceFiles.push({
            type: 'CLIENT_UPLOAD',
            fileUrl: body.designFileUrl,
            uploadedBy: req.user._id,
            uploadedAt: new Date()
          });
        }
      });
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

    // Handle initial payment if provided
    if (body.initialPayment && body.initialPayment.amount > 0) {
      const { recordPayment } = require('../../workflows/payment.workflow');
      await recordPayment({
        orderId: order._id,
        amount: body.initialPayment.amount,
        method: body.initialPayment.method || 'Cash',
        proofUrl: body.initialPayment.proofUrl,
        paymentType: 'Advance'
      }, req.user);
      
      // Reload order to get updated paymentRecords before confirming
      await order.populate('paymentRecords');
    }

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

// ── POST /api/orders/:id/verify ───────────────────────────────────────────────
exports.verifyOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const allowedRoles = ['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'ACCOUNTS'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to verify orders.' });
    }

    if (order.status !== 'Confirmed') {
      return res.status(400).json({ success: false, message: 'Order must be confirmed before it can be verified.' });
    }

    order.verificationStatus = 'Verified';
    order.verifiedBy = req.user._id;
    order.verifiedByName = req.user.name;
    order.verifiedByRole = req.user.role;
    order.verifiedAt = new Date();

    order.addTimelineEvent(
      'Order Verified',
      `Verified by ${req.user.name} (${req.user.role.replace('_', ' ')}).`,
      req.user
    );

    // After Order Verification, trigger the next phase
    if (order.designRequired) {
      const { assignRoundRobin } = require('../../domains/hr/assignment.service');
      order.status = 'Design_Pending';
      order.designStatus = 'Pending';
      order.designRequestedAt = new Date();
      order.addTimelineEvent('Design Request Created', 'Order Verified. Design required. Pending assignment to designer.', req.user);

      try {
        const assignment = await assignRoundRobin('DESIGNER', order._id, null, req.user._id);
        order.designAssignedTo = assignment.assignedTo;
        order.addTimelineEvent('Designer Assigned', 'Automatically assigned designer via Round Robin', req.user);
      } catch (err) {
        console.error('Failed to assign designer automatically:', err);
      }
    } else {
      const { assignRoundRobin } = require('../../domains/hr/assignment.service');
      order.status = 'In_Production';
      order.addTimelineEvent('Production Started', 'Order Verified. No design required. Moving to production.', req.user);
      
      if (!order.operationsManager) {
        try {
          const assignment = await assignRoundRobin('OPERATION_MANAGER', order._id, null, req.user._id);
          order.operationsManager = assignment.assignedTo;
          order.addTimelineEvent('Operations Manager Assigned', 'Automatically assigned operations manager via Round Robin', req.user);
        } catch (err) {
          console.error('Failed to assign ops manager automatically:', err);
        }
      }
    }

    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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

    const orderWorkflow = require('../../workflows/order.workflow');
    const getReqContext = (req) => ({
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      device: req.headers['user-agent']
    });
    const forceAdminUser = { _id: req.user._id, role: 'ADMIN', name: req.user.name };

    // Check if all line items are completed by design
    const allDesignCompleted = order.lineItems.every(li => 
      ['Design Completed', 'Design Provided - Approved'].includes(li.designerStatus) || 
      (!li.designerStatus) // Fallback for very old records
    );
    
    if (allDesignCompleted && ['Design_Pending', 'Design_InProgress', 'Design_Review'].includes(order.status)) {
      order.designStatus = 'Completed';
      await order.save();
      await orderWorkflow.updateOrderStatus(order._id, 'In_Production', forceAdminUser, {}, getReqContext(req));
    }

    // Check if all line items are completed by the service team
    const allCompleted = order.lineItems.every(li => li.serviceStatus === 'completed');
    if (allCompleted && order.status !== 'Completed') {
      await orderWorkflow.updateOrderStatus(order._id, 'Completed', forceAdminUser, {}, getReqContext(req));
    }

    const updatedOrder = await Order.findById(id);
    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

  // ── DELETE /api/orders/:id/line-items/:itemIndex ────────────────────────
  exports.deleteLineItem = async (req, res) => {
    try {
      const { id, itemIndex } = req.params;
      
      // Only Admin or Operations Manager should delete line items
      if (!['ADMIN', 'OPERATION_MANAGER'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete line items.' });
      }

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      if (!order.lineItems || !order.lineItems[itemIndex]) {
        return res.status(404).json({ success: false, message: 'Line item not found.' });
      }

      // Capture details before deletion for history
      const removedItem = order.lineItems[itemIndex];

      // Remove the item
      order.lineItems.splice(itemIndex, 1);

      // Re-calculate order totals
      let newAmount = 0;
      let totalDiscountAmount = 0;
      let totalTaxAmount = 0;
      
      order.lineItems.forEach(item => {
        const itemAmount = item.amount || (item.unitPrice * item.quantity);
        newAmount += itemAmount;
        
        const base = item.quantity * item.unitPrice;
        const discountVal = (base * (item.discount || 0)) / 100;
        const afterDiscount = base - discountVal;
        const taxVal = (afterDiscount * (item.gstRate || 0)) / 100;
        totalDiscountAmount += discountVal;
        totalTaxAmount += taxVal;
      });

      order.amount = newAmount;
      order.subtotal = newAmount;
      order.totalDiscount = totalDiscountAmount;
      order.grandTotal = Math.round(newAmount - totalDiscountAmount + totalTaxAmount);
      order.balanceDue = order.grandTotal - (order.totalPaid || 0);

      order.addTimelineEvent('Service Deleted', `Service "${removedItem.description}" was deleted from the order.`, req.user);

      // Now evaluate if the order should be pushed to In_Production
      const allCompleted = order.lineItems.every(li => 
        !li.designerWorkflow || ['Completed', 'Client-Design Approved'].includes(li.designerWorkflow.currentStatus)
      );

      if (order.lineItems.length > 0 && allCompleted && order.status !== 'In_Production' && order.status !== 'Completed') {
        order.designStatus = 'Completed';
        await order.save();
        
        const orderWorkflow = require('../../workflows/order.workflow');
        const getReqContext = (req) => ({ ipAddress: req.ip, userAgent: req.headers['user-agent'], device: req.headers['user-agent'] });
        const forceAdminUser = { _id: req.user._id, role: 'ADMIN', name: req.user.name };
        
        try {
          await orderWorkflow.updateOrderStatus(order._id, 'In_Production', forceAdminUser, {}, getReqContext(req));
        } catch (wfErr) {
          console.error('Failed to auto-transition order to In_Production:', wfErr.message);
        }
      } else {
        await order.save();
      }

      const updatedOrder = await Order.findById(id);
      res.json({ success: true, message: 'Line item deleted successfully.', data: updatedOrder });
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
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'SR_SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
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
