const mongoose = require('mongoose');
const Prospect = require('../../domains/sales/prospects/prospect.model');
const Order = require('../../domains/orders/order.model');
const prospectWorkflow = require('../../services/workflows/prospectWorkflow.service');

const getReqContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  device: req.headers['user-agent']
});

// GET /api/prospects — list with filters
exports.list = async (req, res) => {
  try {
    const { stage, priority, assignedTo, search } = req.query;
    const filter = { 'softDelete.isDeleted': { $ne: true } }; // Hide soft deleted
    if (stage) filter.stage = stage;
    if (priority) filter.priority = priority;
    
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'SR_SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.assignedTo = req.user._id;
    } else if (assignedTo) {
      if (typeof assignedTo === 'string' && assignedTo.includes(',')) {
        filter.assignedTo = { $in: assignedTo.split(',').map(id => id.trim()) };
      } else if (Array.isArray(assignedTo)) {
        filter.assignedTo = { $in: assignedTo };
      } else {
        filter.assignedTo = assignedTo;
      }
    }
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
    const prospects = await Prospect.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, data: prospects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/prospects/search — global search by phone or company
exports.searchByPhone = async (req, res) => {
  try {
    const { phone, company } = req.query;
    if (!phone && !company) return res.status(400).json({ success: false, message: 'Phone or Business Name is required' });
    
    const conditions = [];
    if (phone) conditions.push({ phone });
    if (company) conditions.push({ company: { $regex: new RegExp(`^${company}$`, 'i') } });

    const prospect = await Prospect.findOne({ $or: conditions, 'softDelete.isDeleted': { $ne: true } })
      .populate('assignedTo', 'name email')
      .lean();
      
    if (prospect) {
      return res.json({ success: true, found: true, type: 'prospect', data: prospect });
    }

    // Fallback: search in Orders collection
    const orderConditions = [];
    if (phone) orderConditions.push({ 'clientSnapshot.phone': phone });
    if (company) orderConditions.push({ 'clientSnapshot.company': { $regex: new RegExp(`^${company}$`, 'i') } });

    const order = await Order.findOne({ $or: orderConditions, 'softDelete.isDeleted': { $ne: true } })
      .populate('salesExec', 'name email role')
      .lean();

    if (order) {
      // Map order clientSnapshot + metadata into a prospect-like structure
      const mappedData = {
        _id: order._id,
        id: order._id,
        name: order.clientSnapshot?.name || 'N/A',
        phone: order.clientSnapshot?.phone || 'N/A',
        company: order.clientSnapshot?.company || 'N/A',
        email: order.clientSnapshot?.email || 'N/A',
        location: order.deliveryAddress || 'N/A',
        priority: 'N/A',
        clientType: order.orderType || 'Retail',
        source: 'Order Database',
        assignedTo: order.salesExec || null,
        executiveName: order.salesExec?.name || 'Not Assigned',
        requirement: {
          service: order.lineItems?.map(item => item.description).join(', ') || 'N/A',
          notes: `Migrated from order ${order.orderNumber || 'N/A'}`
        }
      };
      return res.json({ success: true, found: true, type: 'order', data: mappedData });
    }

    res.json({ success: true, found: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/prospects
exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.assignedTo && (req.user.role === 'SALES_EXEC' || req.user.role === 'SR_SALES_EXEC' || req.user.role === 'FIELD_EXEC')) {
      data.assignedTo = req.user._id;
    }
    const prospect = await prospectWorkflow.createProspect(data, req.user._id, getReqContext(req));
    res.status(201).json({ success: true, data: prospect });
  } catch (err) {
    let message = err.message;
    if (err.code === 11000) message = 'Phone number already exists in our system.';
    res.status(400).json({ success: false, message });
  }
};

// PATCH /api/prospects/:id
exports.update = async (req, res) => {
  try {
    const prospect = await prospectWorkflow.updateProspect(req.params.id, req.body, req.user._id, getReqContext(req));
    res.json({ success: true, data: prospect });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/prospects/:id/stage — move pipeline stage
exports.updateStage = async (req, res) => {
  try {
    const prospect = await prospectWorkflow.updateStage(req.params.id, req.body, req.user._id, getReqContext(req));
    res.json({ success: true, data: prospect });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// POST /api/prospects/:id/interactions
exports.addInteraction = async (req, res) => {
  try {
    const prospect = await prospectWorkflow.addInteraction(req.params.id, req.body, req.user._id, getReqContext(req));
    res.json({ success: true, data: prospect });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/prospects/:id
exports.remove = async (req, res) => {
  try {
    await prospectWorkflow.softDeleteProspect(req.params.id, req.user._id, getReqContext(req));
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/prospects/stats
exports.stats = async (req, res) => {
  try {
    const filter = { 'softDelete.isDeleted': { $ne: true } };
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'SR_SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.assignedTo = new mongoose.Types.ObjectId(req.user._id);
    }

    const [total, inProgress, won, lost, hot, followUps, appointmentStage] = await Promise.all([
      Prospect.countDocuments(filter),
      Prospect.countDocuments({ ...filter, stage: { $nin: ['Won', 'Lost'] }, status: { $nin: ['Canceled', 'Order Confirmed', 'Sale Confirmed'] } }),
      Prospect.countDocuments({ ...filter, stage: 'Won' }),
      Prospect.countDocuments({ ...filter, stage: 'Lost' }),
      Prospect.countDocuments({ ...filter, priority: 'Hot' }),
      Prospect.countDocuments({ ...filter, nextFollowUpDate: { $ne: null }, stage: { $nin: ['Won', 'Lost'] }, status: { $nin: ['Canceled', 'Order Confirmed', 'Sale Confirmed'] } }),
      Prospect.countDocuments({ ...filter, stage: 'Appointment' }),
    ]);

    res.json({
      success: true,
      data: { 
        total, 
        inProgress, 
        won, 
        lost, 
        hot, 
        pendingFollowups: followUps,
        appointmentStage 
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
