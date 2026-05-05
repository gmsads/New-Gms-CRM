/**
 * order.workflow.js
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

  if (order.status !== 'Draft') {
    throw Object.assign(new Error(`Order is already ${order.status}. Cannot re-confirm.`), { statusCode: 422 });
  }

  if (order.grandTotal <= 0) {
    throw Object.assign(new Error('Order has no line items or zero value.'), { statusCode: 422 });
  }

  const advancePct = order.grandTotal > 0 ? (order.advancePaid / order.grandTotal) * 100 : 0;
  const meetsThreshold = advancePct >= 50 || order.advanceApproved;

  if (!meetsThreshold) {
    // Route to approval queue
    order.status = 'Pending_Approval';
    order.addTimelineEvent(
      'Pending Admin Approval',
      `Advance ${advancePct.toFixed(1)}% is below 50%. Routed for admin approval.`,
      user
    );
  } else {
    order.status = 'Confirmed';
    order.addTimelineEvent('Order Confirmed', `Confirmed by ${user.role}: ${user.name}`, user);

    // Trigger design workflow
    if (order.designRequired) {
      order.status      = 'Design_Pending';
      order.designStatus= 'Pending';
      order.designRequestedAt = new Date();
      order.addTimelineEvent('Design Request Created', 'Design required. Pending assignment to designer.', user);
    }

    // Move prospect to Won
    if (order.prospect) {
      await Prospect.findByIdAndUpdate(order.prospect._id || order.prospect, {
        stage: 'Won',
        probability: 100,
        lastInteraction: new Date(),
      });
    }
  }

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
      break;

    case 'In_Production':
      order.addTimelineEvent('Production Started', 'Order entered production/execution phase.', user);
      break;

    case 'Ready_To_Deliver':
      order.addTimelineEvent('Ready for Delivery', 'Order ready to be delivered to client.', user);
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
