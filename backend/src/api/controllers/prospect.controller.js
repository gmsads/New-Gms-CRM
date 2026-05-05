const Prospect = require('../../domains/sales/prospects/prospect.model');

// GET /api/prospects — list with filters
exports.list = async (req, res) => {
  try {
    const { stage, priority, assignedTo, search } = req.query;
    const filter = {};
    if (stage) filter.stage = stage;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
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

// GET /api/prospects/search?phone=  — global phone search
exports.searchByPhone = async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone is required' });
    const prospect = await Prospect.findOne({ phone })
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
    const prospect = new Prospect(req.body);
    await prospect.save();
    res.status(201).json({ success: true, data: prospect });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
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
