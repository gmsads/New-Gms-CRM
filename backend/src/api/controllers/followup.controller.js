const Followup = require('../../domains/sales/followups/followup.model');
const followupWorkflow = require('../../services/workflows/followupWorkflow.service');

const getReqContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  device: req.headers['user-agent']
});

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
    const followup = await followupWorkflow.createFollowup(req.body, req.user._id, getReqContext(req));
    res.status(201).json({ success: true, data: followup });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.complete = async (req, res) => {
  try {
    const followup = await followupWorkflow.completeFollowup(req.params.id, req.body, req.user._id, getReqContext(req));
    res.json({ success: true, data: followup });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
