const mongoose = require('mongoose');
const Prospect = require('../../domains/sales/prospects/prospect.model');

// GET /api/prospects — list with filters
exports.list = async (req, res) => {
  try {
    const { stage, priority, assignedTo, search } = req.query;
    const filter = {};
    if (stage) filter.stage = stage;
    if (priority) filter.priority = priority;
    
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.assignedTo = req.user._id;
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
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

    const prospect = await Prospect.findOne({ $or: conditions })
      .populate('assignedTo', 'name email')
      .lean();
      
    if (!prospect) return res.json({ success: true, found: false });
    res.json({ success: true, found: true, data: prospect });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/prospects
exports.create = async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.assignedTo && (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC')) {
      data.assignedTo = req.user._id;
    }
    const prospect = new Prospect(data);
    await prospect.save();
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
    const prospect = await Prospect.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!prospect) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: prospect });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/prospects/:id/stage — move pipeline stage
exports.updateStage = async (req, res) => {
  try {
    const { stage } = req.body;
    const prospect = await Prospect.findByIdAndUpdate(
      req.params.id,
      { stage, lastInteraction: new Date() },
      { new: true }
    );
    if (!prospect) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: prospect });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/prospects/:id
exports.remove = async (req, res) => {
  try {
    await Prospect.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// GET /api/prospects/stats
exports.stats = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'FIELD_EXEC') {
      filter.assignedTo = new mongoose.Types.ObjectId(req.user._id);
    }

    const [total, inProgress, won, lost, hot, followUps, appointmentStage] = await Promise.all([
      Prospect.countDocuments(filter),
      Prospect.countDocuments({ ...filter, status: 'In-progress' }),
      Prospect.countDocuments({ ...filter, stage: 'Won' }),
      Prospect.countDocuments({ ...filter, stage: 'Lost' }),
      Prospect.countDocuments({ ...filter, priority: 'Hot' }),
      Prospect.countDocuments({ ...filter, stage: 'Follow-up' }),
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
        pendingFollowups: followUps, // Match Follow-up stage count
        appointmentStage 
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
