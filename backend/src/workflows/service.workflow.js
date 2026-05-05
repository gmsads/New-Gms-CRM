/**
 * service.workflow.js
 * Orchestrates BTL (Below The Line) service execution after order confirmation.
 *
 * Flow:
 *  Order Confirmed → Worker Assigned → Service Started → Progress Updates → Delivered → Client Review → Completed
 *
 * This is the BTL Manager's domain.
 */

const Order = require('../domains/orders/order.model');

// ─── Service execution stages ─────────────────────────────────────────────────
const SERVICE_STAGES = {
  ASSIGNED:    'assigned',    // BTL manager assigns worker
  STARTED:     'started',     // Worker marks service started (photo proof)
  IN_PROGRESS: 'in_progress', // Progress updates from field
  COMPLETED:   'completed',   // Worker marks done (photo proof)
  REVIEWED:    'reviewed',    // Client confirms and rates
};

// ─── Assign worker to an order ────────────────────────────────────────────────
/**
 * assignWorker
 * Called by BTL Manager when order enters In_Production.
 *
 * @param {string} orderId
 * @param {string} workerId
 * @param {Object} user - BTL Manager / Operations Manager
 */
const assignWorker = async (orderId, workerId, user) => {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });

  const assignableStatuses = ['In_Production', 'Confirmed', 'Design_Approved'];
  if (!assignableStatuses.includes(order.status)) {
    throw Object.assign(
      new Error(`Cannot assign worker. Order status is '${order.status}'. Must be In_Production.`),
      { statusCode: 422 }
    );
  }

  order.operationsExec = workerId;
  order.addTimelineEvent(
    'Worker Assigned',
    `Field worker assigned by ${user.name} (${user.role}).`,
    user
  );

  await order.save();
  return order;
};

// ─── Record a progress update ─────────────────────────────────────────────────
/**
 * recordProgress
 * Called by Worker (via BTL app) to update service progress.
 *
 * @param {string} orderId
 * @param {Object} data - { progressNote, progressPercent, photoUrl }
 * @param {Object} user - Field worker / Operation Exec
 */
const recordProgress = async (orderId, data, user) => {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });

  if (!['In_Production', 'Ready_To_Deliver'].includes(order.status)) {
    throw Object.assign(
      new Error(`Progress update not allowed. Order status: ${order.status}`),
      { statusCode: 422 }
    );
  }

  const { progressNote, progressPercent, photoUrl } = data;

  const detail = [
    progressNote,
    progressPercent ? `Progress: ${progressPercent}%` : null,
    photoUrl ? '📸 Photo uploaded' : null,
  ].filter(Boolean).join(' | ');

  order.addTimelineEvent('Progress Update', detail, user);

  // Auto-advance if 100% complete
  if (Number(progressPercent) >= 100) {
    order.status = 'Ready_To_Deliver';
    order.addTimelineEvent('Ready for Delivery', 'Worker marked 100% complete.', user);
  }

  await order.save();
  return order;
};

// ─── Mark service as delivered ────────────────────────────────────────────────
/**
 * markDelivered
 * Called by Operations Manager / BTL Manager after physical delivery.
 *
 * @param {string} orderId
 * @param {Object} data - { deliveryProofUrl, deliveryNote }
 * @param {Object} user
 */
const markDelivered = async (orderId, data, user) => {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });

  if (!['Ready_To_Deliver', 'In_Production'].includes(order.status)) {
    throw Object.assign(
      new Error(`Cannot mark as delivered. Current status: ${order.status}`),
      { statusCode: 422 }
    );
  }

  if (!data.deliveryProofUrl) {
    throw Object.assign(
      new Error('Delivery proof photo is mandatory.'),
      { statusCode: 422, code: 'DELIVERY_PROOF_REQUIRED' }
    );
  }

  order.status          = 'Delivered';
  order.deliveredAt     = new Date();
  order.deliveryProofUrl= data.deliveryProofUrl;

  order.addTimelineEvent(
    'Order Delivered',
    `Delivery confirmed by ${user.name}. ${data.deliveryNote || ''}`.trim(),
    user
  );

  await order.save();
  return order;
};

// ─── Capture client review ────────────────────────────────────────────────────
/**
 * captureClientReview
 * Called when client submits review via Client Portal or BTL app.
 * Moves order to Completed.
 *
 * @param {string} orderId
 * @param {Object} data - { clientReview, clientRating (1-5) }
 * @param {Object} user
 */
const captureClientReview = async (orderId, data, user) => {
  const order = await Order.findById(orderId);
  if (!order) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });

  if (order.status !== 'Delivered') {
    throw Object.assign(
      new Error(`Client review can only be captured on Delivered orders. Current: ${order.status}`),
      { statusCode: 422 }
    );
  }

  const { clientReview, clientRating } = data;

  if (!clientReview || !clientReview.trim()) {
    throw Object.assign(new Error('Client review text is required.'), { statusCode: 422 });
  }
  if (!clientRating || clientRating < 1 || clientRating > 5) {
    throw Object.assign(new Error('Client rating must be between 1 and 5.'), { statusCode: 422 });
  }

  // Check full payment before completing
  if (order.balanceDue > 0) {
    throw Object.assign(
      new Error(`Balance due: ₹${order.balanceDue}. Collect remaining payment before completing.`),
      { statusCode: 422, code: 'BALANCE_DUE' }
    );
  }

  order.status       = 'Completed';
  order.clientReview = clientReview;
  order.clientRating = clientRating;
  order.reviewedAt   = new Date();

  order.addTimelineEvent(
    'Order Completed',
    `Client rated ${clientRating}/5 ⭐. Review: "${clientReview}"`,
    user
  );

  await order.save();
  return order;
};

// ─── Get service status summary (for BTL dashboard) ──────────────────────────
const getServiceSummary = async (orderId) => {
  const order = await Order.findById(orderId)
    .populate('salesExec', 'name phone')
    .populate('salesManager', 'name phone')
    .populate('operationsExec', 'name phone')
    .populate('designAssignedTo', 'name')
    .lean();

  if (!order) throw Object.assign(new Error('Order not found.'), { statusCode: 404 });

  return {
    orderNumber:   order.orderNumber,
    client:        order.clientSnapshot,
    status:        order.status,
    designStatus:  order.designStatus,
    paymentStatus: order.paymentStatus,
    totalPaid:     order.totalPaid,
    balanceDue:    order.balanceDue,
    grandTotal:    order.grandTotal,
    team: {
      salesExec:    order.salesExec,
      salesManager: order.salesManager,
      worker:       order.operationsExec,
      designer:     order.designAssignedTo,
    },
    timeline:      order.timeline.slice(-10), // last 10 events
    deliveredAt:   order.deliveredAt,
    clientRating:  order.clientRating,
    clientReview:  order.clientReview,
  };
};

module.exports = {
  assignWorker,
  recordProgress,
  markDelivered,
  captureClientReview,
  getServiceSummary,
  SERVICE_STAGES,
};
