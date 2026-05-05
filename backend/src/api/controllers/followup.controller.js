const Followup = require('../../domains/sales/followups/followup.model');

exports.list = async (req, res) => {
  try {
    const { prospect, status, from, to } = req.query;
    const filter = {};
    if (prospect) filter.prospect = prospect;
    if (status) filter.status = status;
    if (from || to) {
      filter.scheduledAt = {};
      if (from) filter.scheduledAt.$gte = new Date(from);
      if (to) filter.scheduledAt.$lte = new Date(to);
    }
    const followups = await Followup.find(filter)
      .populate('prospect', 'name phone company stage')
      .populate('performedBy', 'name')
      .sort({ scheduledAt: -1 })
      .lean();
    res.json({ success: true, data: followups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const followup = new Followup(req.body);
    await followup.save();
    res.status(201).json({ success: true, data: followup });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.complete = async (req, res) => {
  try {
    const { outcome, notes, nextFollowUpDate, nextAction } = req.body;
    const followup = await Followup.findByIdAndUpdate(
      req.params.id,
      { status: 'Completed', completedAt: new Date(), outcome, notes, nextFollowUpDate, nextAction },
      { new: true }
    );
    if (!followup) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: followup });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
