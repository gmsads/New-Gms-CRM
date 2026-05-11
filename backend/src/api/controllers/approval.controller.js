const mongoose = require('mongoose');
const OrderApproval = require('../../domains/approvals/approval.model');
const Order    = require('../../domains/orders/order.model');
const { createAuditLog } = require('../../guards/audit.helper');

// ── GET /api/approvals ────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',') };
      } else {
        filter.status = status;
      }
    }

    // Sales managers see all approvals, Execs see their own
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.requestedBy = new mongoose.Types.ObjectId(req.user._id);
    }

    const approvals = await OrderApproval.find(filter)
      .populate('requestedBy', 'name email role')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: approvals.length, data: approvals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/approvals/stats ──────────────────────────────────────────────────
const Payment = require('../../domains/payments/payment.model');

exports.getStats = async (req, res) => {
  try {
    const filter = {};
    const paymentFilter = {};
    
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      const uid = new mongoose.Types.ObjectId(req.user._id);
      filter.requestedBy = uid;
      paymentFilter.collectedBy = uid;
    }

    const [orderPending, paymentPending, orderRejected, paymentRejected] = await Promise.all([
      OrderApproval.countDocuments({ ...filter, status: 'Pending' }),
      Payment.countDocuments({ ...paymentFilter, status: 'Pending' }),
      OrderApproval.countDocuments({ ...filter, status: 'Rejected' }),
      Payment.countDocuments({ ...paymentFilter, status: 'Rejected' })
    ]);

    // For executives, both Pending and Rejected are "Action Required" items
    const isExec = req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC';
    const totalCount = isExec 
      ? (orderPending + paymentPending + orderRejected + paymentRejected)
      : (orderPending + paymentPending);

    res.json({ 
      success: true, 
      pendingCount: totalCount,
      details: {
        orders: orderPending,
        payments: paymentPending,
        rejectedOrders: orderRejected,
        rejectedPayments: paymentRejected
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/approvals/:id/approve ───────────────────────────────────────────
exports.approve = async (req, res) => {
  try {
    const approval = await OrderApproval.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, message: 'OrderApproval request not found.' });

    if (approval.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Request is already ${approval.status}` });
    }

    // Update approval record
    approval.status     = 'Approved';
    approval.approvedBy = req.user._id;
    approval.approvedAt = new Date();
    approval.notes      = req.body.notes;
    await approval.save();

    // Update the linked order
    const order = await Order.findById(approval.order);
    if (order) {
      order.advanceApproved   = true;
      order.advanceApprovedBy = req.user._id;
      
      // Advance approved, now confirm the order or move to design
      order.status = 'Confirmed';
      if (order.designRequired) {
        order.status = 'Design_Pending';
        order.designStatus = 'Pending';
        order.designRequestedAt = new Date();
      }

      order.addTimelineEvent(
        'Low Advance Approved',
        `Approved by ${req.user.name} via OrderApprovals portal.`,
        req.user
      );
      await order.save();
    }

    await createAuditLog({
      action: 'APPROVAL_GRANTED',
      performedBy: req.user,
      newValue: { approvalId: approval._id, orderNumber: approval.orderNumber },
      req,
    });

    res.json({ success: true, data: approval });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/approvals/:id/reject ────────────────────────────────────────────
exports.reject = async (req, res) => {
  try {
    const approval = await OrderApproval.findById(req.params.id);
    if (!approval) return res.status(404).json({ success: false, message: 'OrderApproval request not found.' });

    approval.status = 'Rejected';
    approval.approvedBy = req.user._id;
    approval.approvedAt = new Date();
    approval.rejectionReason = req.body.reason || 'Manager rejected low advance.';
    await approval.save();

    // Optionally update order status back to Draft or Cancelled
    const order = await Order.findById(approval.order);
    if (order) {
      order.status = 'Draft'; // Allow exec to fix advance
      order.addTimelineEvent(
        'Low Advance Rejected',
        `Rejected by ${req.user.name}: ${approval.rejectionReason}`,
        req.user
      );
      await order.save();
    }

    res.json({ success: true, data: approval });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
