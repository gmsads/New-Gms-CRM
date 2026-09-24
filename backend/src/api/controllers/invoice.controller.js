const Invoice = require('../../domains/sales/invoices/invoice.model');
const invoiceService = require('../../domains/sales/invoices/invoice.service');
const Order = require('../../domains/orders/order.model');

// POST /api/invoices
exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const invoice = await invoiceService.issueInvoice(order, req.user);
    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/invoices
exports.listInvoices = async (req, res) => {
  try {
    const { 
      page = 1, limit = 20, search, invoiceType, gstType, 
      financialYear, status, orderNumber 
    } = req.query;

    const filter = {};
    if (invoiceType && invoiceType !== 'All') filter.invoiceType = invoiceType;
    if (gstType && gstType !== 'All') filter.gstType = gstType;
    if (financialYear && financialYear !== 'All') filter.financialYear = financialYear;
    if (status && status !== 'All') filter.status = status;

    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerSnapshot.name': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.company': { $regex: search, $options: 'i' } },
        { 'customerSnapshot.gstin': { $regex: search, $options: 'i' } }
      ];
    }

    if (orderNumber) {
      // Find orders matching this orderNumber to filter invoices
      const orders = await Order.find({ orderNumber: { $regex: orderNumber, $options: 'i' } }).select('_id');
      filter.order = { $in: orders.map(o => o._id) };
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate('order', 'orderNumber orderType')
        .populate('issuedBy', 'name email')
        .sort({ invoiceDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Invoice.countDocuments(filter)
    ]);

    // Summary calculation (only for the filtered data)
    let summary = { totalInvoices: total, gstInvoices: 0, nonGstInvoices: 0, cancelled: 0 };
    if (total > 0 && !search) {
      // Pre-calculate some top level metrics if not heavily filtered
      const agg = await Invoice.aggregate([
        { $match: filter },
        { $group: { 
            _id: { type: '$invoiceType', status: '$status' }, 
            count: { $sum: 1 } 
          } 
        }
      ]);
      
      agg.forEach(a => {
        if (a._id.status === 'CANCELLED') summary.cancelled += a.count;
        if (a._id.type === 'GST') summary.gstInvoices += a.count;
        if (a._id.type === 'NON_GST') summary.nonGstInvoices += a.count;
      });
    }

    res.json({
      success: true,
      data: invoices,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      summary
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/invoices/:id
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('order', 'orderNumber orderType')
      .populate('issuedBy', 'name email')
      .lean();
      
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/invoices/:id/cancel
exports.cancelInvoice = async (req, res) => {
  try {
    const { reason } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    if (invoice.status === 'CANCELLED') return res.status(400).json({ success: false, message: 'Invoice is already cancelled' });

    invoice.status = 'CANCELLED';
    invoice.cancelledBy = req.user._id;
    invoice.cancelledAt = new Date();
    invoice.cancellationReason = reason || 'Cancelled by Admin';

    await invoice.save();
    res.json({ success: true, message: 'Invoice cancelled successfully', data: invoice });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
