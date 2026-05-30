/**
s * order.workflow.js
 * Orchestrates the full order lifecycle:
 *
 * Draft → Confirmed → Design (if needed) → In_Production → Delivered → Completed
 *
 * This is the cross-domain coordinator:
 *   - Validates business rules before each transition
 *   - Updates the order status
 *   - Triggers downstream actions (design request, ops notification)
 *   - Writes timeline events
 */

const Order = require('../domains/orders/order.model');
const Prospect = require('../domains/sales/prospects/prospect.model');
const OrderApproval = require('../domains/approvals/approval.model');
const { assignRoundRobin } = require('../domains/hr/assignment.service');

// ─── Valid order status transitions ──────────────────────────────────────────
const ORDER_TRANSITIONS = {
  Draft:            ['Pending_Approval', 'Confirmed', 'Cancelled'],
  Pending_Approval: ['Confirmed', 'Cancelled'],
  Confirmed:        ['Design_Pending', 'In_Production', 'Cancelled'],
  Design_Pending:   ['Design_InProgress', 'Cancelled'],
  Design_InProgress:['Design_Review', 'Cancelled'],
  Design_Review:    ['Design_Approved', 'Design_InProgress'], // approved or revision needed
  Design_Approved:  ['In_Production'],
  In_Production:    ['Ready_To_Deliver'],
  Ready_To_Deliver: ['Delivered'],
  Delivered:        ['Completed', 'In_Production'],           // can re-enter production for fixes
  Completed:        [],
  Cancelled:        [],
};

const MANAGER_ROLES = ['SALES_MANAGER', 'OPERATION_MANAGER', 'ADMIN', 'MD_CEO'];

/**
 * validateOrderTransition — Pure validation
 */
const validateOrderTransition = (currentStatus, targetStatus, userRole) => {
  if (currentStatus === targetStatus) return { valid: true };

  if ((ORDER_TRANSITIONS[currentStatus] || []).length === 0) {
    return { valid: false, reason: `Order status '${currentStatus}' is terminal.` };
  }

  const allowed = ORDER_TRANSITIONS[currentStatus] || [];
  if (allowed.includes(targetStatus)) return { valid: true };

  if (MANAGER_ROLES.includes(userRole)) {
    return { valid: true, forced: true };
  }

  return {
    valid: false,
    reason: `Cannot transition order from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowed.join(', ')}].`,
  };
};

const cancelActiveAppointments = async (order, user) => {
  try {
    let prospectId = order.prospect?._id || order.prospect;
    if (!prospectId && order.clientSnapshot?.phone) {
      const Prospect = require('../domains/sales/prospects/prospect.model');
      const pDoc = await Prospect.findOne({ phone: order.clientSnapshot.phone });
      if (pDoc) prospectId = pDoc._id;
    }
    if (prospectId) {
      const appointmentService = require('../services/appointment.service');
      await appointmentService.cancelActiveAppointmentsForProspect(prospectId, user?._id);
    }
  } catch (err) {
    console.error('Error auto-cancelling appointments in order workflow:', err);
  }
};

/**
 * confirmOrder — Validates and confirms a draft order.
 * Called when Sales Exec submits an order.
 *
 * Business rules:
 *  - grand total must be > 0
 *  - If advance < 50% and not approved → status = Pending_Approval
 *  - Else → status = Confirmed
 *  - Moves linked prospect to 'Won' stage
 *  - Triggers design workflow if designRequired = true
 */
const confirmOrder = async (orderId, user) => {
  const order = await Order.findById(orderId).populate('prospect');
  if (!order) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });

  if (order.status !== 'Draft' && order.status !== 'Pending_Approval') {
    throw Object.assign(new Error(`Order is already ${order.status}. Cannot re-confirm.`), { statusCode: 422 });
  }

  if (order.grandTotal <= 0) {
    throw Object.assign(new Error('Order has no line items or zero value.'), { statusCode: 422 });
  }

  const totalAdvanceProvided = order.paymentRecords
    .filter(p => p.status === 'Verified' || p.status === 'Pending')
    .reduce((s, p) => s + p.amount, 0);

  const advancePct = order.grandTotal > 0 ? (totalAdvanceProvided / order.grandTotal) * 100 : 0;
  const meetsThreshold = advancePct >= 50 || order.advanceApproved;

  if (!meetsThreshold) {
    // Route to approval queue
    order.status = 'Pending_Approval';
    order.addTimelineEvent(
      'Pending Admin Approval',
      `Advance ${advancePct.toFixed(1)}% is below 50%. Routed for admin approval.`,
      user
    );

    // Create the approval tracking record if it doesn't exist
    const existing = await OrderApproval.findOne({ order: order._id, status: 'Pending' });
    if (!existing) {
      await OrderApproval.create({
        order: order._id,
        orderNumber: order.orderNumber,
        requestedBy: order.salesExec || user._id,
        clientName: order.clientSnapshot?.name || 'Unknown',
        grandTotal: order.grandTotal,
        advancePaid: totalAdvanceProvided,
        advancePct: parseFloat(advancePct.toFixed(2)),
        status: 'Pending',
        escalationRole: user.role === 'SALES_MANAGER' ? 'BRANCH_HEAD' : 'SALES_MANAGER'
      });
    }
  } else {
    order.status = 'Confirmed';
    order.verificationStatus = 'Pending';
    order.addTimelineEvent('Order Confirmed', `Confirmed by ${user.role}: ${user.name}`, user);

    // Design workflow will be triggered AFTER Order Verification.
  }

  // Move prospect to Won
  if (order.prospect) {
    await Prospect.findByIdAndUpdate(order.prospect._id || order.prospect, {
      stage: 'Won',
      status: 'Order Confirmed',
      linkedOrderId: order._id,
      convertedToOrder: true,
      convertedDate: new Date(),
      probability: 100,
      lastInteraction: new Date(),
      lastInteractionNote: `Order Confirmed - Order ID: ${order.orderNumber || order._id}`,
      $push: {
        interactions: {
          type: 'Order',
          date: new Date(),
          notes: `Order Confirmed - Order ID: ${order.orderNumber || order._id}`
        }
      }
    });
  } else if (order.clientSnapshot?.phone) {
    await Prospect.findOneAndUpdate(
      { phone: order.clientSnapshot.phone },
      {
        stage: 'Won',
        status: 'Order Confirmed',
        linkedOrderId: order._id,
        convertedToOrder: true,
        convertedDate: new Date(),
        probability: 100,
        lastInteraction: new Date(),
        lastInteractionNote: `Order Confirmed - Order ID: ${order.orderNumber || order._id}`,
        $push: {
          interactions: {
            type: 'Order',
            date: new Date(),
            notes: `Order Confirmed - Order ID: ${order.orderNumber || order._id}`
          }
        }
      }
    );
  }

  // Cancel associated active appointments
  await cancelActiveAppointments(order, user);

  await order.save();
  return order;
};

/**
 * updateOrderStatus — Generic status transition with validation.
 * Used for all status changes after confirmation.
 */
const updateOrderStatus = async (orderId, targetStatus, user, extraData = {}) => {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });

  const { valid, reason, forced } = validateOrderTransition(order.status, targetStatus, user.role);
  if (!valid) throw Object.assign(new Error(reason), { statusCode: 422, code: 'INVALID_ORDER_TRANSITION' });

  const previousStatus = order.status;
  order.status = targetStatus;

  // Handle side effects per transition
  switch (targetStatus) {
    case 'Design_InProgress':
      order.designStatus = 'In_Progress';
      if (extraData.designAssignedTo) order.designAssignedTo = extraData.designAssignedTo;
      order.addTimelineEvent('Design Started', `Design work in progress.`, user);
      break;

    case 'Design_Review':
      order.designStatus = 'Demo_Shared';
      order.addTimelineEvent('Design Demo Shared', 'Design demo shared with client for approval.', user);
      break;

    case 'Design_Approved':
      order.designStatus = 'Approved';
      order.designApprovedAt = new Date();
      order.addTimelineEvent('Design Approved', 'Client approved the design. Ready for production.', user);

      try {
        const assignment = await assignRoundRobin('OPERATION_MANAGER', order._id, null, user._id);
        order.operationsManager = assignment.assignedTo;
        order.addTimelineEvent('Operations Manager Assigned', 'Automatically assigned operations manager via Round Robin', user);
      } catch (err) {
        console.error('Failed to assign ops manager automatically:', err);
      }
      break;

    case 'In_Production':
      if (!order.operationsManager && !order.designRequired) {
        try {
          const assignment = await assignRoundRobin('OPERATION_MANAGER', order._id, null, user._id);
          order.operationsManager = assignment.assignedTo;
          order.addTimelineEvent('Operations Manager Assigned', 'Automatically assigned operations manager via Round Robin', user);
        } catch (err) {
          console.error('Failed to assign ops manager automatically:', err);
        }
      }
      order.addTimelineEvent('Production Started', 'Order entered production/execution phase.', user);
      break;

    case 'Ready_To_Deliver':
      order.addTimelineEvent('Ready for Delivery', 'Order ready to be delivered to client.', user);
      if (!order.serviceManager) {
        try {
          const assignment = await assignRoundRobin('SERVICE_MANAGER', order._id, null, user._id);
          order.serviceManager = assignment.assignedTo;
          order.addTimelineEvent('Service Manager Assigned', 'Automatically assigned service manager via Round Robin', user);
          
          order.lineItems.forEach(item => {
            if (!item.serviceWorkflow) item.serviceWorkflow = {};
            item.serviceWorkflow.serviceManagerId = assignment.assignedTo;
            if (!item.serviceWorkflow.status) item.serviceWorkflow.status = 'Pending Service';
          });
        } catch (err) {
          console.error('Failed to assign service manager automatically:', err);
        }
      }
      break;

    case 'Delivered':
      order.deliveredAt = new Date();
      if (extraData.deliveryProofUrl) order.deliveryProofUrl = extraData.deliveryProofUrl;
      order.addTimelineEvent('Order Delivered', 'Order delivered to client. Awaiting review.', user);
      break;

    case 'Completed':
      if (extraData.clientReview) order.clientReview = extraData.clientReview;
      if (extraData.clientRating) order.clientRating  = extraData.clientRating;
      order.reviewedAt = new Date();
      order.addTimelineEvent('Order Completed', `Client rated ${extraData.clientRating}/5. "${extraData.clientReview}"`, user);
      break;

    case 'Cancelled':
      order.cancelledAt  = new Date();
      order.cancelReason = extraData.cancelReason || 'Not specified';
      order.addTimelineEvent('Order Cancelled', order.cancelReason, user);
      break;
  }

  if (forced) {
    order.addTimelineEvent('Status Force-Updated', `${previousStatus} → ${targetStatus} (forced by ${user.role})`, user);
  }

  // Automatic prospect pipeline update
  if (targetStatus === 'Completed') {
    if (order.prospect) {
      await Prospect.findByIdAndUpdate(order.prospect._id || order.prospect, {
        stage: 'Won',
        status: 'Sale Confirmed',
        linkedOrderId: order._id,
        probability: 100,
        lastInteraction: new Date(),
        lastInteractionNote: `Sale Confirmed - Order ID: ${order.orderNumber || order._id}`,
        $push: {
          interactions: {
            type: 'Order',
            date: new Date(),
            notes: `Sale Confirmed - Order ID: ${order.orderNumber || order._id}`
          }
        }
      });
    } else if (order.clientSnapshot?.phone) {
      await Prospect.findOneAndUpdate(
        { phone: order.clientSnapshot.phone },
        {
          stage: 'Won',
          status: 'Sale Confirmed',
          linkedOrderId: order._id,
          probability: 100,
          lastInteraction: new Date(),
          lastInteractionNote: `Sale Confirmed - Order ID: ${order.orderNumber || order._id}`,
          $push: {
            interactions: {
              type: 'Order',
              date: new Date(),
              notes: `Sale Confirmed - Order ID: ${order.orderNumber || order._id}`
            }
          }
        }
      );
    }
  } else if (targetStatus === 'Confirmed') {
    if (order.prospect) {
      await Prospect.findByIdAndUpdate(order.prospect._id || order.prospect, {
        stage: 'Won',
        status: 'Order Confirmed',
        linkedOrderId: order._id,
        probability: 100,
        lastInteraction: new Date(),
        lastInteractionNote: `Order Confirmed - Order ID: ${order.orderNumber || order._id}`,
        $push: {
          interactions: {
            type: 'Order',
            date: new Date(),
            notes: `Order Confirmed - Order ID: ${order.orderNumber || order._id}`
          }
        }
      });
    } else if (order.clientSnapshot?.phone) {
      await Prospect.findOneAndUpdate(
        { phone: order.clientSnapshot.phone },
        {
          stage: 'Won',
          status: 'Order Confirmed',
          linkedOrderId: order._id,
          probability: 100,
          lastInteraction: new Date(),
          lastInteractionNote: `Order Confirmed - Order ID: ${order.orderNumber || order._id}`,
          $push: {
            interactions: {
              type: 'Order',
              date: new Date(),
              notes: `Order Confirmed - Order ID: ${order.orderNumber || order._id}`
            }
          }
        }
      );
    }
  }

  if (targetStatus === 'Completed' || targetStatus === 'Confirmed') {
    await cancelActiveAppointments(order, user);
  }

  await order.save();
  return order;
};

/**
 * Middleware: validateOrderStatusMiddleware
 * Use on PATCH /orders/:id/status
 */
const validateOrderStatusMiddleware = async (req, res, next) => {
  try {
    const { status: targetStatus } = req.body;
    if (!targetStatus) return res.status(400).json({ message: 'target status required.' });

    const order = await Order.findById(req.params.id).select('status designRequired designStatus');
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    const { valid, reason } = validateOrderTransition(order.status, targetStatus, req.user.role);
    if (!valid) {
      return res.status(422).json({
        message: reason,
        code: 'INVALID_ORDER_TRANSITION',
        currentStatus: order.status,
        targetStatus,
      });
    }

    req.resource = order;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  confirmOrder,
  updateOrderStatus,
  validateOrderTransition,
  validateOrderStatusMiddleware,
  ORDER_TRANSITIONS,
};
