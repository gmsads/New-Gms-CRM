const mongoose = require('mongoose');
const Order = require('../../domains/orders/order.model');
const DesignAsset = require('../../domains/design/asset.model');

// Helper to sanitize the order and return just the service
const mapToDesignerDTO = (order, itemIndex) => {
  const item = order.lineItems[itemIndex];
  return {
    orderId: order._id,
    orderNumber: order.orderNumber,
    salesExecName: order.salesExec?.name || 'Manager',
    clientName: order.clientSnapshot?.name || 'Unknown',
    companyName: order.clientSnapshot?.company || 'Unknown',
    clientPhone: order.clientSnapshot?.phone || 'Unknown',
    clientEmail: order.clientSnapshot?.email || '',
    
    // Service specifics
    itemIndex: itemIndex,
    description: item.description,
    designerWorkflow: item.designerWorkflow || {
      workflowType: 'DESIGN_CREATED',
      currentStatus: 'Assigned',
      statusHistory: [],
      assignedDesigners: [],
      revisionCount: 0
    },
    serviceFiles: item.serviceFiles || [],
    
    // Dates
    orderCreatedAt: order.createdAt,
    deadline: item.designerWorkflow?.deadline || order.deliveryTimeline,
    deliveryDate: item.deliveryDate || order.deliveryDate,
    priority: item.designerWorkflow?.priority || 'Normal',
  };
};

// ── GET /api/design/services ───────────────────────────────────────────────────
exports.getServices = async (req, res) => {
  try {
    const { status, workflowType } = req.query;
    
    // Find orders that have lineItems with designer workflow and have been verified
    const filter = { 
      'lineItems': { $exists: true, $not: { $size: 0 } },
      status: { $nin: ['Draft', 'Pending_Approval', 'Cancelled'] }
    };
    
    const orders = await Order.find(filter)
      .select('orderNumber clientSnapshot lineItems createdAt deliveryTimeline deliveryDate status designAssignedTo salesExec')
      .populate('salesExec', 'name')
      .lean();

    let services = [];

    orders.forEach(order => {
      order.lineItems.forEach((item, index) => {
        // If the user is a DESIGNER, only show if assigned to them (either line item or entire order) or if it's unassigned
        const isAssigned = (item.designerWorkflow?.assignedDesigners?.some(
          d => d.userId?.toString() === req.user._id.toString()
        )) || (order.designAssignedTo && order.designAssignedTo.toString() === req.user._id.toString());
        
        const isUnassigned = (!item.designerWorkflow?.assignedDesigners || item.designerWorkflow.assignedDesigners.length === 0) && !order.designAssignedTo;
        
        // Let admins see all, designers see only their assigned work or unassigned work
        if (req.user.role === 'DESIGNER' && !isAssigned && !isUnassigned) {
          return;
        }

        // Apply query filters
        if (status && item.designerWorkflow?.currentStatus !== status) return;
        if (workflowType && item.designerWorkflow?.workflowType !== workflowType) return;

        services.push(mapToDesignerDTO(order, index));
      });
    });

    res.json({ success: true, count: services.length, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/design/services/:orderId/:itemIndex/status ──────────────────────
exports.updateServiceStatus = async (req, res) => {
  try {
    const { orderId, itemIndex } = req.params;
    const { status, note, rejectionReason } = req.body;

    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const item = order.lineItems[itemIndex];
    if (!item) return res.status(404).json({ success: false, message: 'Service not found' });

    if (!item.designerWorkflow) {
      item.designerWorkflow = {
        workflowType: 'DESIGN_CREATED',
        currentStatus: 'Assigned',
        statusHistory: [],
        assignedDesigners: [],
        revisionCount: 0
      };
    }

    const oldStatus = item.designerWorkflow.currentStatus;
    item.designerWorkflow.currentStatus = status;
    item.designerWorkflow.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user._id,
      note: note || (rejectionReason ? `Rejected: ${rejectionReason}` : '')
    });

    if (status === 'Revision Requested') {
      item.designerWorkflow.revisionCount = (item.designerWorkflow.revisionCount || 0) + 1;
    }
    
    if (status === 'Completed' || status === 'Client-Design Approved') {
      item.designerWorkflow.completedAt = new Date();
    }
    
    // Add timeline event to master order
    order.addTimelineEvent(
      'Service Status Updated',
      `${item.description} status changed to ${status}`,
      req.user
    );

    await order.save();

    // Check automation rule: if ALL services are completed, move order to In_Production
    const allCompleted = order.lineItems.every(li => 
      !li.designerWorkflow || ['Completed', 'Client-Design Approved'].includes(li.designerWorkflow.currentStatus)
    );

    if (allCompleted && order.status !== 'In_Production' && order.status !== 'Completed') {
      order.designStatus = 'Completed';
      await order.save();
      
      // Import workflow dynamically to avoid circular deps
      const orderWorkflow = require('../../workflows/order.workflow');
      const forceAdminUser = { _id: req.user._id, role: 'ADMIN', name: req.user.name };
      
      const getReqContext = (req) => ({
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        device: req.headers['user-agent']
      });

      try {
        await orderWorkflow.updateOrderStatus(order._id, 'In_Production', forceAdminUser, {}, getReqContext(req));
      } catch (wfErr) {
        console.error('Failed to auto-transition order:', wfErr.message);
      }
    }

    res.json({ success: true, data: mapToDesignerDTO(await Order.findById(orderId), itemIndex) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/design/services/:orderId/:itemIndex/files ────────────────────────
exports.uploadServiceFile = async (req, res) => {
  try {
    const { orderId, itemIndex } = req.params;
    const { type, notes } = req.body;
    let fileUrl = req.body.fileUrl;

    if (!type) {
      return res.status(400).json({ success: false, message: 'Type is required' });
    }

    const hostUrl = `${req.protocol}://${req.get('host')}`;
    if (req.files && req.files.designAsset && req.files.designAsset[0]) {
      fileUrl = `${hostUrl}/uploads/design/${req.files.designAsset[0].filename}`;
    }

    if (!fileUrl) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const item = order.lineItems[itemIndex];
    if (!item) return res.status(404).json({ success: false, message: 'Service not found' });

    if (!item.serviceFiles) item.serviceFiles = [];

    item.serviceFiles.push({
      type,
      fileUrl,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
      version: item.serviceFiles.filter(f => f.type === type).length + 1,
      notes
    });

    if (type === 'APPROVAL_PROOF') {
      if (!item.designerWorkflow) item.designerWorkflow = {};
      item.designerWorkflow.approvalUploadedAt = new Date();
    }

    order.addTimelineEvent(
      'Service File Uploaded',
      `File of type ${type} uploaded for ${item.description}`,
      req.user
    );

    await order.save();
    
    res.json({ success: true, data: mapToDesignerDTO(await Order.findById(orderId), itemIndex) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const { paginate, formatPaginatedResponse } = require('../../utils/pagination');

// ── GET /api/design/assets ─────────────────────────────────────────────────────
exports.getAssets = async (req, res) => {
  try {
    const { category, search } = req.query;
    const { page, limit, skip, sort } = paginate(req.query);
    let query = {};

    if (category && category !== 'All' && category !== 'Approved Design Archives') {
      query.category = category;
    }
    if (search) query.$text = { $search: search };

    // Example logic: if designer, only show global assets or assets created by them
    if (req.user.role === 'DESIGNER') {
      query.$or = [{ isGlobal: true }, { createdBy: req.user._id }];
    }

    const [assets, totalAssets] = await Promise.all([
      DesignAsset.find(query).populate('createdBy', 'name email').sort(sort).skip(skip).limit(limit).lean(),
      DesignAsset.countDocuments(query)
    ]);
    
    // Fetch completed order line items to display as assets (skipping pagination on this combined virtual list for now, but keeping limits)
    const Order = require('../../domains/orders/order.model');
    const orders = await Order.find({
      'lineItems.designerWorkflow.currentStatus': { $in: ['Completed', 'Client-Design Approved'] }
    }).populate('salesExec clientSnapshot');
    
    const completedServices = [];
    orders.forEach(order => {
      order.lineItems.forEach(item => {
        if (['Completed', 'Client-Design Approved'].includes(item.designerWorkflow?.currentStatus)) {
          // Check category filter
          if (category && category !== 'All' && category !== 'Approved Design Archives') return;
          
          // Check search filter
          if (search && !item.description.toLowerCase().includes(search.toLowerCase()) && 
              !(order.clientSnapshot?.company || '').toLowerCase().includes(search.toLowerCase())) return;

          // Find the relevant file (FINAL or APPROVAL_PROOF or CLIENT_UPLOAD)
          const file = item.serviceFiles?.find(f => f.type === 'FINAL') || 
                       item.serviceFiles?.find(f => f.type === 'APPROVAL_PROOF') || 
                       item.serviceFiles?.find(f => f.type === 'CLIENT_UPLOAD');
          
          completedServices.push({
            _id: `${order._id}-${item._id}`,
            title: item.description,
            description: `Order: ${order.orderNumber || order._id}`,
            category: 'Approved Design Archives',
            fileUrl: file?.fileUrl || '',
            fileType: file?.fileUrl?.startsWith('data:image') ? 'image/png' : 'application/pdf',
            tags: ['Completed', order.orderType || 'General'],
            brand: order.clientSnapshot?.company || 'N/A',
            createdAt: item.designerWorkflow?.completedAt || order.createdAt
          });
        }
      });
    });

    const combinedData = [...assets, ...completedServices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(formatPaginatedResponse(combinedData, totalAssets + completedServices.length, page, limit));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/design/assets ────────────────────────────────────────────────────
exports.createAsset = async (req, res) => {
  try {
    let fileUrl = req.body.fileUrl;
    const hostUrl = `${req.protocol}://${req.get('host')}`;
    if (req.files && req.files.designAsset && req.files.designAsset[0]) {
      fileUrl = `${hostUrl}/uploads/design/${req.files.designAsset[0].filename}`;
    }

    const asset = new DesignAsset({
      ...req.body,
      fileUrl,
      createdBy: req.user._id
    });
    await asset.save();
    res.status(201).json({ success: true, data: asset });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
