const mongoose = require('mongoose');
const Order = require('../../domains/orders/order.model');

// Helper to map order and lineItem to a production job DTO
const mapToProductionJobDTO = (order, itemIndex) => {
  const item = order.lineItems[itemIndex];
  return {
    orderId: order._id,
    orderNumber: order.orderNumber,
    salesExecName: order.salesExec?.name || 'Unknown',
    clientName: order.clientSnapshot?.name || 'Unknown',
    companyName: order.clientSnapshot?.company || 'Unknown',
    orderType: order.orderType,
    orderCreatedAt: order.createdAt,
    
    // Service specifics
    itemIndex: itemIndex,
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    deadline: item.deadline,
    deliveryDate: item.deliveryDate || order.deliveryDate,
    
    // Production specifics
    productionWorkflow: item.productionWorkflow || {
      status: 'Pending Production',
      isDelayed: false,
      reworkRequired: false,
      auditLogs: [],
      proofs: []
    },
    
    // Derived states
    isDelayed: item.productionWorkflow?.isDelayed || false,
    delayReason: item.productionWorkflow?.delayReason || null,
    qcStatus: item.productionWorkflow?.qcStatus || 'Pending',
    reworkRequired: item.productionWorkflow?.reworkRequired || false
  };
};

// ── Validation Map ────────────────────────────────────────────────────────
const VALID_TRANSITIONS = {
  'Pending Production': ['Scheduled', 'Printing', 'Printing Started', 'Fabrication In Progress', 'Production In Progress', 'Issues/Delayed'],
  'Scheduled': ['Printing', 'Printing Started', 'Fabrication In Progress', 'Production In Progress', 'Issues/Delayed'],
  'Printing': ['QC Check', 'QC Pending', 'Pending QC', 'Fabrication In Progress', 'Production In Progress', 'Issues/Delayed'],
  'Printing Started': ['Fabrication In Progress', 'Production In Progress', 'QC Pending', 'Pending QC', 'Production Completed', 'Issues/Delayed'],
  'Fabrication In Progress': ['Production In Progress', 'QC Pending', 'Pending QC', 'Production Completed', 'Issues/Delayed'],
  'Production In Progress': ['QC Check', 'QC Pending', 'Pending QC', 'Production Completed', 'Issues/Delayed'],
  'QC Check': ['Completed', 'Production Completed', 'Rework In Progress', 'Issues/Delayed'],
  'QC Pending': ['Completed', 'Production Completed', 'Rework In Progress', 'Issues/Delayed'],
  'Pending QC': ['Completed', 'Production Completed', 'Rework In Progress', 'Issues/Delayed'],
  'Rework In Progress': ['QC Check', 'QC Pending', 'Pending QC', 'Production Completed', 'Issues/Delayed'],
  'Completed': ['Ready For Service'],
  'Production Completed': ['Ready For Service'],
  'Issues/Delayed': ['Printing', 'QC Check', 'QC Pending', 'Pending QC', 'Completed', 'Production Completed', 'Ready For Service'],
  'Ready For Service': [] // End state for production phase
};

// ── GET /api/production/jobs ──────────────────────────────────────────────────
exports.getProductionJobs = async (req, res) => {
  try {
    const { status, isDelayed, assignedToMe } = req.query;
    
    // Base filter: Orders that have not been cancelled, and are not Draft/Pending_Approval
    const filter = {
      'lineItems': { $exists: true, $not: { $size: 0 } },
      status: { $nin: ['Draft', 'Pending_Approval', 'Cancelled'] }
    };

    const orders = await Order.find(filter)
      .select('orderNumber clientSnapshot orderType lineItems createdAt deliveryDate status salesExec')
      .populate('salesExec', 'name')
      .populate('lineItems.productionWorkflow.productionExecutiveId', 'name')
      .populate('lineItems.productionWorkflow.productionManagerId', 'name')
      .lean();

    let jobs = [];

    orders.forEach(order => {
      order.lineItems.forEach((item, index) => {
        // Must be in a state where design is completed, or no design required,
        // so it has reached production. We'll simplify this by checking if it has a productionWorkflow
        // or if the order itself has reached In_Production.
        
        // But the prompt says: "When ALL designs are completed: automatically move service items to Production Queue."
        // We will show items where order status is at least 'In_Production' or design is 'Completed'.
        // Actually, we should just show all items that are meant to be in production. 
        // If order.designStatus === 'Completed' or 'Not_Required' or order.status === 'In_Production' or 'Ready_To_Deliver'
        
        // Filter by assigned to me
        if (assignedToMe === 'true') {
          const execId = item.productionWorkflow?.productionExecutiveId?._id?.toString() || item.productionWorkflow?.productionExecutiveId?.toString();
          const mgrId = item.productionWorkflow?.productionManagerId?._id?.toString() || item.productionWorkflow?.productionManagerId?.toString();
          
          if (execId !== req.user._id.toString() && mgrId !== req.user._id.toString()) {
            return;
          }
        }

        // Filter by status
        if (status && item.productionWorkflow?.status !== status) return;

        // Filter by delay
        if (isDelayed === 'true' && !item.productionWorkflow?.isDelayed) return;

        // Skip if already handed over
        if (item.productionWorkflow?.handoverStatus === 'Handed Over') return;

        jobs.push(mapToProductionJobDTO(order, index));
      });
    });

    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/production/jobs/:orderId/:itemIndex/assign ─────────────────────
exports.assignJob = async (req, res) => {
  try {
    const { orderId, itemIndex } = req.params;
    const { productionExecutiveId, assignedMachine, estimatedCompletion } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const item = order.lineItems[itemIndex];
    if (!item) return res.status(404).json({ success: false, message: 'Service not found' });

    if (!item.productionWorkflow) item.productionWorkflow = {};

    item.productionWorkflow.productionManagerId = req.user._id;
    if (productionExecutiveId) item.productionWorkflow.productionExecutiveId = productionExecutiveId;
    if (assignedMachine) item.productionWorkflow.assignedMachine = assignedMachine;
    if (estimatedCompletion) item.productionWorkflow.estimatedCompletion = estimatedCompletion;

    if (item.productionWorkflow.status === 'Pending Production') {
      item.productionWorkflow.status = 'Scheduled';
    }

    item.productionWorkflow.auditLogs.push({
      action: 'Assignment',
      previousStatus: item.productionWorkflow.status,
      newStatus: item.productionWorkflow.status,
      updatedBy: req.user._id,
      role: req.user.role,
      remarks: `Assigned Exec: ${productionExecutiveId}, Machine: ${assignedMachine}`,
      timestamp: new Date()
    });

    await order.save();
    res.json({ success: true, data: mapToProductionJobDTO(order, itemIndex) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/production/jobs/:orderId/:itemIndex/status ────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { orderId, itemIndex } = req.params;
    const { status, remarks } = req.body;

    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const item = order.lineItems[itemIndex];
    if (!item) return res.status(404).json({ success: false, message: 'Service not found' });

    if (!item.productionWorkflow) item.productionWorkflow = {};

    const currentStatus = item.productionWorkflow.status || 'Pending Production';
    
    // Strict Validation
    const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(status) && currentStatus !== status) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid transition from ${currentStatus} to ${status}. Allowed: ${allowedNext.join(', ')}` 
      });
    }

    item.productionWorkflow.status = status;

    if (['Printing', 'Printing Started', 'Fabrication In Progress', 'Production In Progress'].includes(status) && !item.productionWorkflow.startedAt) {
      item.productionWorkflow.startedAt = new Date();
    }

    if (status === 'Production Completed' || status === 'Completed') {
      item.productionWorkflow.actualCompletion = new Date();
    }
    
    if (status === 'Ready For Service') {
      item.productionWorkflow.handoverStatus = 'Ready For Service';
    }

    item.productionWorkflow.auditLogs.push({
      action: 'Status Update',
      previousStatus: currentStatus,
      newStatus: status,
      updatedBy: req.user._id,
      role: req.user.role,
      remarks: remarks || '',
      timestamp: new Date()
    });

    order.addTimelineEvent(
      'Production Status Updated',
      `${item.description} production status changed to ${status}`,
      req.user
    );

    await order.save();

    // Check Automation Rule 2: When ALL production line items completed, move order to Service Queue.
    // For this app, moving to Service Queue means updating top-level order status.
    const allProdCompleted = order.lineItems.every(li => 
      !li.productionWorkflow || ['Ready For Service', 'Production Completed', 'Completed'].includes(li.productionWorkflow.status) || li.productionWorkflow.handoverStatus === 'Handed Over'
    );

    if (allProdCompleted && order.status === 'In_Production') {
      try {
        const orderWorkflow = require('../../workflows/order.workflow');
        const forceAdminUser = { _id: req.user._id, role: 'ADMIN', name: req.user.name };
        await orderWorkflow.updateOrderStatus(order._id, 'Ready_To_Deliver', forceAdminUser, {}, { ipAddress: req.ip });
      } catch (wfErr) {
        console.error('Failed to auto-transition order to Service Queue:', wfErr.message);
      }
    }

    res.json({ success: true, data: mapToProductionJobDTO(order, itemIndex) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/production/jobs/:orderId/:itemIndex/qc ─────────────────────────
exports.performQC = async (req, res) => {
  try {
    const { orderId, itemIndex } = req.params;
    const { qcAction, remarks, producedQuantity, damagedQuantity } = req.body;
    // qcAction can be 'Approve' or 'Reject'

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const item = order.lineItems[itemIndex];
    if (!item) return res.status(404).json({ success: false, message: 'Service not found' });
    if (!item.productionWorkflow) item.productionWorkflow = {};

    const prevStatus = item.productionWorkflow.status;

    if (producedQuantity !== undefined) item.productionWorkflow.producedQuantity = producedQuantity;
    if (damagedQuantity !== undefined) item.productionWorkflow.damagedQuantity = damagedQuantity;
    
    item.productionWorkflow.qcRemarks = remarks;
    item.productionWorkflow.qcCompletedAt = new Date();

    if (qcAction === 'Approve') {
      item.productionWorkflow.qcStatus = 'Approved';
      item.productionWorkflow.reworkRequired = false;
      // Depending on workflow, manager might manually move to Production Completed or Ready For Service after QC
    } else if (qcAction === 'Reject') {
      item.productionWorkflow.qcStatus = 'Rejected';
      item.productionWorkflow.reworkRequired = true;
      item.productionWorkflow.status = 'Rework In Progress';
      item.productionWorkflow.reworkCount = (item.productionWorkflow.reworkCount || 0) + 1;
      
      item.productionWorkflow.reworkHistory.push({
        reason: remarks,
        requestedAt: new Date(),
        requestedBy: req.user._id
      });
    }

    item.productionWorkflow.auditLogs.push({
      action: `QC ${qcAction}`,
      previousStatus: prevStatus,
      newStatus: item.productionWorkflow.status,
      updatedBy: req.user._id,
      role: req.user.role,
      remarks: remarks || '',
      timestamp: new Date()
    });

    order.addTimelineEvent(
      'Production QC Performed',
      `QC ${qcAction} for ${item.description}`,
      req.user
    );

    await order.save();
    res.json({ success: true, data: mapToProductionJobDTO(order, itemIndex) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/production/jobs/:orderId/:itemIndex/delay ──────────────────────
exports.reportDelay = async (req, res) => {
  try {
    const { orderId, itemIndex } = req.params;
    const { delayReason, remarks, isDelayed } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const item = order.lineItems[itemIndex];
    if (!item) return res.status(404).json({ success: false, message: 'Service not found' });
    if (!item.productionWorkflow) item.productionWorkflow = {};

    item.productionWorkflow.isDelayed = isDelayed;
    if (isDelayed) {
      item.productionWorkflow.delayReason = delayReason;
      item.productionWorkflow.delayedAt = new Date();
    } else {
      item.productionWorkflow.delayReason = null;
    }

    item.productionWorkflow.auditLogs.push({
      action: isDelayed ? 'Marked Delayed' : 'Delay Resolved',
      previousStatus: item.productionWorkflow.status,
      newStatus: item.productionWorkflow.status,
      updatedBy: req.user._id,
      role: req.user.role,
      remarks: (isDelayed ? `${delayReason}: ` : '') + (remarks || ''),
      timestamp: new Date()
    });

    await order.save();
    res.json({ success: true, data: mapToProductionJobDTO(order, itemIndex) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/production/jobs/:orderId/:itemIndex/proofs ─────────────────────
exports.uploadProof = async (req, res) => {
  try {
    const { orderId, itemIndex } = req.params;
    const { url, type } = req.body;

    if (!url || !type) return res.status(400).json({ success: false, message: 'Url and type required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const item = order.lineItems[itemIndex];
    if (!item) return res.status(404).json({ success: false, message: 'Service not found' });
    if (!item.productionWorkflow) item.productionWorkflow = {};
    if (!item.productionWorkflow.proofs) item.productionWorkflow.proofs = [];
    if (!item.productionWorkflow.auditLogs) item.productionWorkflow.auditLogs = [];

    item.productionWorkflow.proofs.push({
      url,
      type,
      uploadedAt: new Date(),
      uploadedBy: req.user._id
    });

    item.productionWorkflow.auditLogs.push({
      action: 'Proof Uploaded',
      previousStatus: item.productionWorkflow.status,
      newStatus: item.productionWorkflow.status,
      updatedBy: req.user._id,
      role: req.user.role,
      remarks: `Uploaded ${type}`,
      timestamp: new Date()
    });

    await order.save();
    res.json({ success: true, data: mapToProductionJobDTO(order, itemIndex) });
  } catch (err) {
    require('fs').appendFileSync('upload_error.txt', new Date().toISOString() + ': ' + (err.stack || err.message) + '\n');
    res.status(500).json({ success: false, message: err.message + ' | ' + err.stack });
  }
};
