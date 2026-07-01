const Quotation = require('../../domains/sales/quotations/quotation.model');
const quotationWorkflow = require('../../services/workflows/quotationWorkflow.service');

const getReqContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  device: req.headers['user-agent']
});

exports.list = async (req, res) => {
  try {
    const { status, assignedTo, search, startDate, endDate, page, limit } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo) filter.executive = assignedTo;
    
    // Role based filtering
    if (req.user.role === 'SALES_EXEC' || req.user.role === 'SR_SALES_EXEC') {
      filter.executive = req.user._id;
    }
    
    // Date filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    
    // Search filter across related collections (Prospect & User)
    if (search) {
      const regex = new RegExp(search, 'i');
      
      // Find prospect IDs matching name or company
      const Prospect = require('../../domains/sales/prospects/prospect.model');
      const prospects = await Prospect.find({
        $or: [{ name: regex }, { company: regex }, { phone: regex }]
      }).select('_id');
      const prospectIds = prospects.map(p => p._id);
      
      // Find executive IDs matching name
      const User = require('../../domains/users/user.model');
      const users = await User.find({ name: regex }).select('_id');
      const userIds = users.map(u => u._id);
      
      filter.$or = [
        { quotationId: regex },
        { prospect: { $in: prospectIds } },
        { executive: { $in: userIds } }
      ];
    }
    
    const hasPagination = page !== undefined || limit !== undefined;
    
    let query = Quotation.find(filter)
      .populate('prospect', 'name phone company')
      .populate('executive', 'name')
      .sort({ createdAt: -1 });

    const total = await Quotation.countDocuments(filter);
    
    if (hasPagination) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const skip = (pageNum - 1) * limitNum;
      query = query.skip(skip).limit(limitNum);
      
      const quotations = await query.lean();
      res.json({
        success: true,
        data: quotations,
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      });
    } else {
      const quotations = await query.lean();
      res.json({
        success: true,
        data: quotations,
        total
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.bulkImport = async (req, res) => {
  try {
    const records = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Expected an array of quotations' });
    }

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    const BATCH_SIZE = 25;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (record) => {
        try {
          const body = { ...record };
          if (!body.executive) {
            body.executive = req.user._id;
          }

          // Add dummy line item for total calculation if missing
          if (!body.lineItems || body.lineItems.length === 0) {
            body.lineItems = [{
              description: 'Historical Quotation Data',
              quantity: 1,
              unitPrice: body.totalAmount || 0,
              gstRate: 0,
              discount: 0
            }];
          }

          await quotationWorkflow.createQuotation(body, req.user._id, getReqContext(req));
          successCount++;
        } catch (err) {
          failedCount++;
          errors.push({ quotationId: record.quotationId || 'Unknown', error: err.message });
        }
      }));
    }

    res.status(201).json({ success: true, successCount, failedCount, errors });
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
