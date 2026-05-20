const Quotation = require('../../domains/sales/quotations/quotation.model');
const quotationWorkflow = require('../../services/workflows/quotationWorkflow.service');

const getReqContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  device: req.headers['user-agent']
});

exports.list = async (req, res) => {
  try {
    const { status, assignedTo } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo) filter.executive = assignedTo;
    
    // Role based filtering
    if (req.user.role === 'SALES_EXEC') {
      filter.executive = req.user._id;
    }
    
    const quotations = await Quotation.find(filter)
      .populate('prospect', 'name phone company')
      .populate('executive', 'name')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const quotation = await quotationWorkflow.createQuotation(req.body, req.user._id, getReqContext(req));
    res.status(201).json({ success: true, data: quotation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const quotation = await quotationWorkflow.updateQuotation(req.params.id, req.body, req.user._id, getReqContext(req));
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const quotation = await quotationWorkflow.updateStatus(req.params.id, req.body, req.user._id, getReqContext(req));
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
