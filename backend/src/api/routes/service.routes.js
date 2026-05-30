const express = require('express');
const router = express.Router();
const Order = require('../../domains/orders/order.model');
const { protect } = require('../../guards/auth.guard');
const { can, authorize } = require('../../guards/role.guard');

// GET /api/service/queue (Ready for Service or Pending Service)
router.get('/queue', protect, authorize('SERVICE_MANAGER', 'ADMIN', 'MD_CEO'), async (req, res, next) => {
  try {
    const orders = await Order.find({
      'lineItems': { 
        $elemMatch: { 
          $or: [
            { 'serviceWorkflow.status': 'Pending Service' },
            { 'productionWorkflow.status': { $in: ['Ready For Service', 'Production Completed', 'Completed'] }, 'serviceWorkflow.status': { $ne: 'Service Completed' } }
          ]
        } 
      }
    }).populate('salesExec', 'name')
      .populate('client', 'company name')
      .sort({ deliveryDate: 1 }); // Priority sorted

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

// GET /api/service/active (Scheduled, In Progress, etc)
router.get('/active', protect, authorize('SERVICE_MANAGER', 'ADMIN', 'MD_CEO'), async (req, res, next) => {
  try {
    const activeStatuses = ['Scheduled', 'Labour Assigned', 'Vendor Assigned', 'In Transit', 'Installation Started', 'Installation In Progress', 'Installation Completed', 'Client Confirmation Pending'];
    const orders = await Order.find({
      'lineItems.serviceWorkflow.status': { $in: activeStatuses }
    }).populate('salesExec', 'name')
      .populate('lineItems.serviceWorkflow.serviceExecutiveId', 'name')
      .populate('lineItems.serviceWorkflow.vendorId', 'companyName')
      .populate('lineItems.serviceWorkflow.labourIds', 'name')
      .populate('lineItems.serviceWorkflow.vehicleId', 'vehicleNumber')
      .sort({ deliveryDate: 1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

// GET /api/service/completed
router.get('/completed', protect, authorize('SERVICE_MANAGER', 'ADMIN', 'MD_CEO'), async (req, res, next) => {
  try {
    const orders = await Order.find({
      'lineItems.serviceWorkflow.status': 'Service Completed'
    }).populate('salesExec', 'name')
      .populate('lineItems.serviceWorkflow.serviceExecutiveId', 'name')
      .sort({ updatedAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

// GET /api/service/my-tasks (For Service Exec)
router.get('/my-tasks', protect, can('SERVICE_EXEC'), async (req, res, next) => {
  try {
    const orders = await Order.find({
      'lineItems.serviceWorkflow.serviceExecutiveId': req.user._id,
      'lineItems.serviceWorkflow.status': { $ne: 'Service Completed' }
    }).populate('salesExec', 'name')
      .sort({ deliveryDate: 1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

// PUT /api/service/assign/:orderId/item/:itemId
router.post('/jobs/:orderId/:itemIndex/assign', protect, authorize('SERVICE_MANAGER', 'ADMIN', 'MD_CEO'), async (req, res, next) => {
  try {
    const { serviceExecutiveId, vendorId, labourIds, vehicleId, scheduleDate } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const item = order.lineItems.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    if (!item.serviceWorkflow) item.serviceWorkflow = {};

    if (serviceExecutiveId) item.serviceWorkflow.serviceExecutiveId = serviceExecutiveId;
    if (vendorId) item.serviceWorkflow.vendorId = vendorId;
    if (labourIds) item.serviceWorkflow.labourIds = labourIds;
    if (vehicleId) item.serviceWorkflow.vehicleId = vehicleId;
    if (scheduleDate) item.serviceWorkflow.scheduleDate = scheduleDate;

    // Update status based on assignment
    if (scheduleDate && item.serviceWorkflow.status === 'Pending Service') {
      item.serviceWorkflow.status = 'Scheduled';
    }
    if (labourIds && labourIds.length > 0) item.serviceWorkflow.status = 'Labour Assigned';
    if (vendorId) item.serviceWorkflow.status = 'Vendor Assigned';

    item.serviceWorkflow.auditLogs.push({
      action: 'Assigned Resources',
      updatedBy: req.user._id,
      role: req.user.role,
      remarks: 'Assigned execution resources'
    });

    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// PUT /api/service/status/:orderId/item/:itemId
router.put('/status/:orderId/item/:itemId', protect, can('SERVICE_EXEC', 'SERVICE_MANAGER', 'ADMIN'), async (req, res, next) => {
  try {
    const { status, installedQuantity, remarks } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const item = order.lineItems.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const previousStatus = item.serviceWorkflow.status;
    
    // Service Manager Approval Logic
    if (status === 'Service Completed' && req.user.role !== 'SERVICE_MANAGER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only Service Manager can approve completion' });
    }

    if (status === 'Service Completed') {
      // Validate photos & confirmation
      const hasBefore = item.serviceWorkflow.proofs.some(p => p.type === 'BEFORE');
      const hasDuring = item.serviceWorkflow.proofs.some(p => p.type === 'DURING');
      const hasAfter = item.serviceWorkflow.proofs.some(p => p.type === 'AFTER');
      const hasSignature = item.serviceWorkflow.proofs.some(p => p.type === 'SIGNATURE');
      
      if (!hasBefore || !hasDuring || !hasAfter || !hasSignature) {
        return res.status(400).json({ success: false, message: 'All proofs (Before, During, After, Signature) are required for completion' });
      }
      item.serviceWorkflow.completedAt = new Date();
    }

    item.serviceWorkflow.status = status;
    
    if (installedQuantity !== undefined) {
      item.installedQuantity = installedQuantity;
      item.remainingQuantity = item.quantity - installedQuantity;
    }

    item.serviceWorkflow.auditLogs.push({
      action: 'Status Update',
      previousStatus,
      newStatus: status,
      updatedBy: req.user._id,
      role: req.user.role,
      remarks: remarks || `Status changed to ${status}`
    });

    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// POST /api/service/proof/:orderId/item/:itemId
router.post('/proof/:orderId/item/:itemId', protect, can('SERVICE_EXEC', 'SERVICE_MANAGER'), async (req, res, next) => {
  try {
    const { type, url } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const item = order.lineItems.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    item.serviceWorkflow.proofs.push({
      type,
      url,
      uploadedBy: req.user._id
    });

    item.serviceWorkflow.auditLogs.push({
      action: 'Proof Upload',
      updatedBy: req.user._id,
      role: req.user.role,
      remarks: `Uploaded ${type} proof`
    });

    await order.save();
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
