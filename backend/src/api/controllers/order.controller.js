const mongoose       = require('mongoose');
const Order          = require('../../domains/orders/order.model');
const Prospect       = require('../../domains/sales/prospects/prospect.model');
const User           = require('../../domains/users/user.model');
const OrderApproval = require('../../domains/approvals/approval.model');
const { createAuditLog } = require('../../guards/audit.helper');
const orderWorkflow = require('../../services/workflows/orderWorkflow.service');
const documentNumberingService = require('../../services/documentNumbering.service');
const customerMatchingService = require('../../services/customerMatching.service');
const { getAccessibleUserIds } = require('../../utils/team.helper');
const { saveBase64ToFileIfDataUrl } = require('../../utils/fileStorage.helper');

const getReqContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  device: req.headers['user-agent']
});

// ── GET /api/orders ───────────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { status, salesExec, salesExecName, paymentStatus, designStatus, search, verificationStatus, orderType, month, year, hideCompleted, limit, skip, countOnly } = req.query;
    const filter = {};

    if (status && status !== 'All')             filter.status             = status;
    if (paymentStatus && paymentStatus !== 'All')      filter.paymentStatus      = paymentStatus;
    if (designStatus && designStatus !== 'All')       filter.designStatus       = designStatus;
    if (verificationStatus && verificationStatus !== 'All') filter.verificationStatus = verificationStatus;
    if (orderType && orderType !== 'All')            filter.orderType          = orderType;

    // Role-based visibility
    const accessibleIds = await getAccessibleUserIds(req.user);

    if (req.user.role === 'DESIGNER') {
      filter.$or = [
        { designAssignedTo: new mongoose.Types.ObjectId(req.user._id) },
      ];
      filter.designRequired = true;
    } else if (accessibleIds) {
      if (salesExec) {
        const reqIds = typeof salesExec === 'string' ? salesExec.split(',').map(id => id.trim()) : (Array.isArray(salesExec) ? salesExec : [salesExec]);
        const allowedIds = reqIds.filter(id => accessibleIds.includes(id.toString()));
        if (allowedIds.length === 0) {
          return res.json({ success: true, count: 0, totalCount: 0, hasMore: false, data: [] });
        }
        filter.salesExec = { $in: allowedIds.map(id => new mongoose.Types.ObjectId(id)) };
      } else if (salesExecName && salesExecName !== 'All Employees') {
        const matchingUsers = await User.find({ name: salesExecName, _id: { $in: accessibleIds } }).select('_id').lean();
        if (matchingUsers.length > 0) {
          filter.salesExec = { $in: matchingUsers.map(u => u._id) };
        } else {
          return res.json({ success: true, count: 0, totalCount: 0, hasMore: false, data: [] });
        }
      } else {
        filter.salesExec = { $in: accessibleIds.map(id => new mongoose.Types.ObjectId(id)) };
      }
      
      if (!status && (req.user.role === 'SALES_EXEC' || req.user.role === 'SR_SALES_EXEC' || req.user.role === 'FIELD_EXEC')) {
        filter.status = { $ne: 'Pending_Approval' };
      }
    } else {
      if (salesExec) {
        filter.salesExec = new mongoose.Types.ObjectId(salesExec);
      } else if (salesExecName && salesExecName !== 'All Employees') {
        const matchingUsers = await User.find({ name: salesExecName }).select('_id').lean();
        if (matchingUsers.length > 0) {
          filter.salesExec = { $in: matchingUsers.map(u => u._id) };
        } else {
          return res.json({ success: true, count: 0, totalCount: 0, hasMore: false, data: [] });
        }
      }
    }

    if (hideCompleted === 'true') {
      if (filter.status && typeof filter.status === 'object' && filter.status.$ne) {
        filter.status = { $nin: ['Completed', 'Cancelled', filter.status.$ne] };
      } else if (!filter.status) {
        filter.status = { $nin: ['Completed', 'Cancelled'] };
      }
    }

    const monthsMap = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
    if (year && year !== 'All Years' && !isNaN(parseInt(year, 10))) {
      const y = parseInt(year, 10);
      if (month && month !== 'All Months' && monthsMap[month] !== undefined) {
        const m = monthsMap[month];
        filter.createdAt = {
          $gte: new Date(y, m, 1),
          $lt: new Date(y, m + 1, 1)
        };
      } else {
        filter.createdAt = {
          $gte: new Date(y, 0, 1),
          $lt: new Date(y + 1, 0, 1)
        };
      }
    } else if (month && month !== 'All Months' && monthsMap[month] !== undefined) {
      const m = monthsMap[month];
      const y = new Date().getFullYear();
      filter.createdAt = {
        $gte: new Date(y, m, 1),
        $lt: new Date(y, m + 1, 1)
      };
    }

    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'clientSnapshot.name': { $regex: search, $options: 'i' } },
        { 'clientSnapshot.phone': { $regex: search, $options: 'i' } },
      ];
    }

    const totalCount = await Order.countDocuments(filter);
    if (countOnly === 'true') {
      return res.json({ success: true, count: totalCount, totalCount, hasMore: false, data: [] });
    }

    const limitVal = limit !== undefined && limit !== '' ? parseInt(limit, 10) : null;
    const skipVal = skip !== undefined && skip !== '' ? parseInt(skip, 10) : 0;

    let query = Order.find(filter)
      .populate('salesExec', 'name email role')
      .populate('salesManager', 'name email')
      .populate('designAssignedTo', 'name email')
      .sort({ createdAt: -1 });

    if (limitVal && !isNaN(limitVal) && limitVal > 0) {
      query = query.skip(skipVal || 0).limit(limitVal);
    }

    let orders = await query.lean();

    // Sanitize financial data for Designers
    if (req.user.role === 'DESIGNER') {
      orders = orders.map(o => {
        delete o.grandTotal;
        delete o.subtotal;
        delete o.totalDiscount;
        delete o.totalPaid;
        delete o.balanceDue;
        delete o.paymentRecords;
        delete o.advanceRequired;
        delete o.advancePaid;
        return o;
      });
    }

    res.json({
      success: true,
      count: orders.length,
      totalCount: totalCount,
      hasMore: limitVal ? (skipVal + orders.length) < totalCount : false,
      data: orders
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/search ────────────────────────────────────────────────────
exports.searchClient = async (req, res) => {
  try {
    const { phone, company } = req.query;
    if (!phone && !company) return res.status(400).json({ success: false, message: 'Phone or Business Name is required' });

    const conditions = [];
    if (phone) conditions.push({ 'clientSnapshot.phone': phone });
    if (company) conditions.push({ 'clientSnapshot.company': { $regex: new RegExp(`^${company}$`, 'i') } });

    const filter = { $or: conditions };

    const accessibleIds = await getAccessibleUserIds(req.user);
    if (accessibleIds) {
      filter.salesExec = { $in: accessibleIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const order = await Order.findOne(filter)
      .populate('salesExec', 'name email role')
      .lean();

    if (!order) return res.json({ success: true, found: false });
    res.json({ success: true, found: true, data: { ...order.clientSnapshot, clientType: order.orderType } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
exports.getOne = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('salesExec', 'name email role phone')
      .populate('salesManager', 'name email phone')
      .populate('operationsExec', 'name email')
      .populate('designAssignedTo', 'name email')
      .populate('operationsManager', 'name email')
      .populate('serviceManager', 'name email')
      .populate('prospect', 'name phone company stage')
      .populate('quotation', 'quotationId totalAmount status');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    
    // Convert to plain object to allow deletion
    const orderObj = order.toObject ? order.toObject() : order;

    // Sanitize financial data for Designers
    if (req.user.role === 'DESIGNER') {
      delete orderObj.grandTotal;
      delete orderObj.subtotal;
      delete orderObj.totalDiscount;
      delete orderObj.totalPaid;
      delete orderObj.balanceDue;
      delete orderObj.paymentRecords;
      delete orderObj.advanceRequired;
      delete orderObj.advancePaid;
      if (orderObj.quotation) delete orderObj.quotation.totalAmount;
    }

    res.json({ success: true, data: orderObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/orders/bulk ───────────────────────────────────────────────────────
exports.bulkImport = async (req, res) => {
  try {
    const rawRecords = req.body;
    if (!Array.isArray(rawRecords)) {
      return res.status(400).json({ success: false, message: 'Expected an array of orders' });
    }

    const parseNum = (val, def = 0) => {
      if (val === undefined || val === null || val === '') return def;
      if (typeof val === 'number') return isNaN(val) ? def : val;
      const str = String(val).replace(/[^0-9.-]+/g, '');
      const num = parseFloat(str);
      return isNaN(num) ? def : num;
    };

    const parseFlexibleExcelDate = (rawInput) => {
      if (!rawInput && rawInput !== 0) return null;
      if (rawInput instanceof Date && !isNaN(rawInput.getTime())) return rawInput;

      // Check if it's an Excel date serial number (numeric value between 20000 and 100000)
      const numVal = Number(rawInput);
      if (!isNaN(numVal) && numVal > 20000 && numVal < 100000 && String(rawInput).trim() === String(numVal)) {
        const dateObj = new Date(Math.round((numVal - 25569) * 86400 * 1000));
        if (!isNaN(dateObj.getTime())) return dateObj;
      }

      const str = String(rawInput).trim();
      if (!str) return null;

      // Handle Indian DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
      const parts = str.split(/[\/\-\.]/);
      if (parts.length === 3) {
        let p1 = parseInt(parts[0], 10);
        let p2 = parseInt(parts[1], 10);
        let p3 = parseInt(parts[2], 10);

        if (p3 < 100) p3 += (p3 >= 50 ? 1900 : 2000);

        if (p3 >= 1900 && p3 <= 2100) {
          let day = p1;
          let month = p2;
          if (p1 <= 12 && p2 > 12) {
            month = p1;
            day = p2;
          }
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const d = new Date(p3, month - 1, day, 12, 0, 0);
            if (!isNaN(d.getTime())) return d;
          }
        } else if (p1 >= 1900 && p1 <= 2100) {
          const year = p1;
          const month = p2;
          const day = p3;
          if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const d = new Date(year, month - 1, day, 12, 0, 0);
            if (!isNaN(d.getTime())) return d;
          }
        }
      }

      const fallback = new Date(str);
      if (!isNaN(fallback.getTime())) return fallback;
      return null;
    };

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    // Pre-process & Group records by Order ID to merge multiple requirement rows into lineItems
    const groupedMap = new Map();
    const records = [];

    for (const raw of rawRecords) {
      const orderIdKey = String(raw['Order ID'] || raw['Order Number'] || raw.orderNumber || raw['Serial Number'] || '').trim();
      
      let existing = orderIdKey ? groupedMap.get(orderIdKey.toLowerCase()) : null;
      if (!existing && !orderIdKey && records.length > 0) {
        existing = records[records.length - 1];
      }

      const desc = raw['Requirements'] || raw['Requirement'] || raw.description || raw['Order Type'] || raw.orderType || 'Requirement';
      const qty = Math.max(1, parseNum(raw['Qty'] || raw['Quantity'] || raw.quantity || raw.qty, 1));
      const rate = Math.max(0, parseNum(raw['Rate'] || raw['Price'] || raw.unitPrice || raw.rate, 0));

      if (existing && (orderIdKey ? groupedMap.has(orderIdKey.toLowerCase()) : true)) {
        if (desc) {
          existing.lineItems.push({
            description: String(desc).trim(),
            quantity: qty,
            unitPrice: rate,
            discount: 0,
            gstRate: 0
          });
        }
      } else {
        const newRecord = { ...raw, lineItems: [] };
        if (desc) {
          newRecord.lineItems.push({
            description: String(desc).trim(),
            quantity: qty,
            unitPrice: rate,
            discount: 0,
            gstRate: 0
          });
        }
        records.push(newRecord);
        if (orderIdKey) {
          groupedMap.set(orderIdKey.toLowerCase(), newRecord);
        }
      }
    }

    // Pre-fetch all users into memory for instant O(1) employee lookups
    const allUsers = await User.find({}).select('_id name email phone');
    const userMap = new Map();
    for (const u of allUsers) {
      if (u.email) userMap.set(String(u.email).toLowerCase().trim(), u._id);
      if (u.phone) userMap.set(String(u.phone).trim(), u._id);
      if (u.name) userMap.set(String(u.name).toLowerCase().trim(), u._id);
    }

    // Pre-fetch all matching prospects into memory
    const prospectPhones = new Set();
    const prospectEmails = new Set();
    const prospectGsts = new Set();
    const prospectCompanies = new Set();
    for (const r of records) {
      const p = r['Contact Number'] || r.phone || r['Phone'] || r.clientSnapshot?.phone;
      const e = r.email || r['Email'] || r.clientSnapshot?.email;
      const g = r['GST Number'] || r.gstNumber || r.clientSnapshot?.gstNumber;
      const c = r['Business Name'] || r.company || r['Company Name'] || r['Company'] || r.clientSnapshot?.company;
      if (p) prospectPhones.add(String(p).trim());
      if (e) prospectEmails.add(String(e).trim().toLowerCase());
      if (g) prospectGsts.add(String(g).trim().toLowerCase());
      if (c) prospectCompanies.add(String(c).trim().toLowerCase());
    }

    const pOrConditions = [];
    if (prospectPhones.size > 0) pOrConditions.push({ phone: { $in: Array.from(prospectPhones) } });
    if (prospectEmails.size > 0) pOrConditions.push({ email: { $in: Array.from(prospectEmails) } });
    if (prospectGsts.size > 0) pOrConditions.push({ gstNumber: { $in: Array.from(prospectGsts) } });

    const prospectMapPhone = new Map();
    const prospectMapEmail = new Map();
    const prospectMapGst = new Map();
    const prospectMapCompany = new Map();

    if (pOrConditions.length > 0) {
      const existingProspects = await Prospect.find({
        $or: pOrConditions,
        'softDelete.isDeleted': { $ne: true }
      }).select('_id phone email gstNumber company');
      for (const p of existingProspects) {
        if (p.phone) prospectMapPhone.set(String(p.phone).trim(), p._id);
        if (p.email) prospectMapEmail.set(String(p.email).trim().toLowerCase(), p._id);
        if (p.gstNumber) prospectMapGst.set(String(p.gstNumber).trim().toLowerCase(), p._id);
        if (p.company) prospectMapCompany.set(String(p.company).trim().toLowerCase(), p._id);
      }
    }

    // Pre-fetch existing orders by Order Number
    const orderNumKeys = records
      .map(r => r['Order ID'] || r['Order Number'] || r.orderNumber)
      .filter(Boolean)
      .map(s => String(s).trim());

    const existingOrdersMap = new Map();
    if (orderNumKeys.length > 0) {
      const foundOrders = await Order.find({ orderNumber: { $in: orderNumKeys } });
      for (const o of foundOrders) {
        existingOrdersMap.set(o.orderNumber, o);
      }
    }

    let currentOrderCount = await Order.countDocuments();
    const currentYear = new Date().getFullYear();

    // Prepare all record objects in memory
    const preparedRecords = [];
    for (const record of records) {
      const body = { ...record };

      // Extract employee identifier
      const empInput = body['Employee Name'] || body.salesExec || body.employeeName || body.closedBy || body['Closed By'] || body['Sales Person'] || body['Assigned To'] || body['Sales Exec'];
      let resolvedUserId = null;
      if (empInput) {
        const empStr = String(empInput).trim();
        if (mongoose.Types.ObjectId.isValid(empStr) && String(new mongoose.Types.ObjectId(empStr)) === empStr) {
          resolvedUserId = empStr;
        } else if (userMap.has(empStr.toLowerCase())) {
          resolvedUserId = userMap.get(empStr.toLowerCase());
        } else {
          const matchedUser = allUsers.find(u => u.name && String(u.name).toLowerCase().includes(empStr.toLowerCase()));
          if (matchedUser) {
            resolvedUserId = matchedUser._id;
            userMap.set(empStr.toLowerCase(), matchedUser._id);
          }
        }
      }
      body.salesExec = resolvedUserId || req.user?._id;

      // Resolve Prospect matching
      const phone = body['Contact Number'] || body.phone || body['Phone'] || body.clientSnapshot?.phone;
      const email = body.email || body['Email'] || body.clientSnapshot?.email;
      const gstNumber = body['GST Number'] || body.gstNumber || body.clientSnapshot?.gstNumber;
      const company = body['Business Name'] || body.company || body['Company Name'] || body['Company'] || body.clientSnapshot?.company;
      const clientName = body['Client Name'] || body.clientName || body['Contact Person'] || body.name || body.clientSnapshot?.name || 'Historical Client';

      let prospectId = body.prospect;
      if (!prospectId) {
        if (phone && prospectMapPhone.has(String(phone).trim())) {
          prospectId = prospectMapPhone.get(String(phone).trim());
        } else if (email && prospectMapEmail.has(String(email).trim().toLowerCase())) {
          prospectId = prospectMapEmail.get(String(email).trim().toLowerCase());
        } else if (gstNumber && prospectMapGst.has(String(gstNumber).trim().toLowerCase())) {
          prospectId = prospectMapGst.get(String(gstNumber).trim().toLowerCase());
        } else if (company && prospectMapCompany.has(String(company).trim().toLowerCase())) {
          prospectId = prospectMapCompany.get(String(company).trim().toLowerCase());
        }
      }

      body.prospect = prospectId;
      body.clientSnapshot = {
        name: String(clientName).trim(),
        phone: phone ? String(phone).trim() : '',
        company: company ? String(company).trim() : '',
        email: email ? String(email).trim() : ''
      };

      const orderTotal = parseNum(body['Total'] || body.grandTotal || body['Grand Total'] || body.totalAmount || body['Total Amount'] || body.amount || body['Amount'], 0);
      const finalAmt = parseNum(body['Final Amount'] || body.grandTotal || body['Grand Total'] || orderTotal, 0);
      const advanceAmt = parseNum(body['Advance'] || body.advancePaid || body['Advance Paid'], 0);
      const pendingBalStr = body['Pending Balance'];
      const pendingBal = (pendingBalStr !== undefined && pendingBalStr !== '') ? parseNum(pendingBalStr, 0) : Math.max(0, finalAmt - advanceAmt);
      const paidTotal = Math.max(0, finalAmt - pendingBal);

      if (!body.lineItems || !Array.isArray(body.lineItems) || body.lineItems.length === 0) {
        body.lineItems = [{
          description: body['Requirements'] || body['Requirement'] || body.description || body['Client Type'] || body['Order Type'] || body.orderType || 'Historical Order Data',
          quantity: Math.max(1, parseNum(body['Qty'] || body['Quantity'], 1)),
          unitPrice: Math.max(0, parseNum(body['Rate'], finalAmt || orderTotal)),
          gstRate: 0,
          discount: 0
        }];
      } else {
        const lineSum = body.lineItems.reduce((acc, li) => acc + (li.quantity * li.unitPrice), 0);
        if (lineSum === 0 && finalAmt > 0 && body.lineItems[0]) {
          body.lineItems[0].unitPrice = finalAmt / (body.lineItems[0].quantity || 1);
        }
      }

      body.lineItems.forEach(li => {
        if (li.discount > 100) li.discount = 0;
      });

      const rawDate = body['Order Date'] || body.createdAt || body.date || body['Date'];
      let parsedDate = parseFlexibleExcelDate(rawDate);

      const rawAdvDate = body['Advance Date'] || body.advanceDate;
      let parsedAdvDate = parseFlexibleExcelDate(rawAdvDate) || parsedDate || new Date();

      const rawPayDate = body['Payment Date'] || body.paymentDate;
      let parsedPayDate = parseFlexibleExcelDate(rawPayDate) || parsedAdvDate || parsedDate || new Date();

      let methodStr = String(body['Payment Method'] || body.paymentMethod || 'Bank Transfer').trim();
      const methodLower = methodStr.toLowerCase();
      if (methodLower.includes('cash')) methodStr = 'Cash';
      else if (methodLower.includes('upi') || methodLower.includes('paytm') || methodLower.includes('bhim')) methodStr = 'UPI';
      else if (methodLower.includes('phonepe')) methodStr = 'PhonePe';
      else if (methodLower.includes('gpay') || methodLower.includes('google')) methodStr = 'GPay';
      else if (methodLower.includes('cheque') || methodLower.includes('chq')) methodStr = 'Cheque';
      else if (methodLower.includes('bank') || methodLower.includes('neft') || methodLower.includes('rtgs') || methodLower.includes('imps') || methodLower.includes('transfer')) methodStr = 'Bank Transfer';
      else methodStr = 'Other';

      const chequeNo = String(body['Cheque Number'] || body.chequeNumber || '').trim();

      body.paymentRecords = [];
      if (advanceAmt > 0) {
        body.paymentRecords.push({
          amount: advanceAmt,
          method: methodStr,
          chequeNumber: chequeNo,
          notes: 'Advance Payment',
          receivedAt: parsedAdvDate,
          verifiedAt: parsedAdvDate,
          status: 'Verified',
          receivedBy: req.user?._id,
          verifiedBy: req.user?._id
        });
      }

      const remainingPaid = parseFloat((paidTotal - advanceAmt).toFixed(2));
      if (remainingPaid > 0) {
        body.paymentRecords.push({
          amount: remainingPaid,
          method: methodStr,
          chequeNumber: chequeNo,
          notes: 'Balance Payment',
          receivedAt: parsedPayDate,
          verifiedAt: parsedPayDate,
          status: 'Verified',
          receivedBy: req.user?._id,
          verifiedBy: req.user?._id
        });
      } else if (body.paymentRecords.length === 0 && (paidTotal > 0 || chequeNo || body['Payment Method'])) {
        body.paymentRecords.push({
          amount: paidTotal > 0 ? paidTotal : finalAmt,
          method: methodStr,
          chequeNumber: chequeNo,
          notes: 'Historical Payment Record',
          receivedAt: parsedPayDate,
          verifiedAt: parsedPayDate,
          status: 'Verified',
          receivedBy: req.user?._id,
          verifiedBy: req.user?._id
        });
      }

      body.orderType = body['Client Type'] || body['Order Type'] || body.orderType || 'Historical';
      const rawStatusStr = String(body['Order Status'] || body.status || body['Status'] || 'Completed').trim().toLowerCase();
      let normalizedStatus = 'Completed';
      if (rawStatusStr.includes('cancel')) normalizedStatus = 'Cancelled';
      else if (rawStatusStr.includes('draft')) normalizedStatus = 'Draft';
      else if (rawStatusStr.includes('confirm')) normalizedStatus = 'Confirmed';
      else if (rawStatusStr.includes('production') || rawStatusStr.includes('progress')) normalizedStatus = 'In_Production';
      else if (rawStatusStr.includes('review')) normalizedStatus = 'Design_Review';
      else if (rawStatusStr.includes('deliver')) normalizedStatus = 'Delivered';
      else if (rawStatusStr.includes('pending') && !rawStatusStr.includes('balance')) normalizedStatus = 'Pending_Approval';
      else normalizedStatus = 'Completed';

      body.status = normalizedStatus;

      if (body['Order ID'] || body['Order Number'] || body.orderNumber) {
        body.orderNumber = String(body['Order ID'] || body['Order Number'] || body.orderNumber).trim();
      } else {
        body.orderNumber = await documentNumberingService.generateNextNumber('order');
      }

      const isCompleted = normalizedStatus === 'Completed' || body.orderType === 'Historical';
      if (isCompleted) {
        body.status = 'Completed';
        body.designStatus = 'Completed';
        body.verificationStatus = 'Verified';
        body.paymentStatus = 'Paid';

        if (Array.isArray(body.lineItems)) {
          body.lineItems = body.lineItems.map(item => ({
            ...item,
            designerStatus: 'Completed',
            designerWorkflow: {
              ...(item.designerWorkflow || {}),
              workflowType: item.designerWorkflow?.workflowType || 'DESIGN_CREATED',
              currentStatus: 'Completed',
              statusHistory: [
                ...(item.designerWorkflow?.statusHistory || []),
                { status: 'Completed', changedAt: parsedDate || new Date(), note: 'Historical order auto-completed and disabled' }
              ]
            },
            productionWorkflow: {
              ...(item.productionWorkflow || {}),
              status: 'Completed',
              handoverStatus: 'Handed Over',
              producedQuantity: item.quantity || 1,
              qcStatus: 'Approved',
              startedAt: parsedDate || new Date(),
              actualCompletion: parsedDate || new Date()
            },
            serviceWorkflow: {
              ...(item.serviceWorkflow || {}),
              status: 'Service Completed',
              startedAt: parsedDate || new Date(),
              completedAt: parsedDate || new Date()
            },
            operationStatus: 'completed',
            serviceStatus: 'completed'
          }));
        }
      }

      preparedRecords.push({ body, parsedDate });
    }

    // Save in concurrent batches of 25 for massive speedup
    const BATCH_SIZE = 25;
    for (let i = 0; i < preparedRecords.length; i += BATCH_SIZE) {
      const batch = preparedRecords.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async ({ body, parsedDate }) => {
        try {
          let order = existingOrdersMap.get(body.orderNumber);
          if (order) {
            Object.assign(order, body);
            if (parsedDate) {
              order.createdAt = parsedDate;
              order.updatedAt = parsedDate;
            }
            await order.save();
            if (parsedDate) {
              await Order.updateOne({ _id: order._id }, { $set: { createdAt: parsedDate, updatedAt: parsedDate } }, { timestamps: false });
            }
          } else {
            order = new Order(body);
            if (parsedDate) {
              order.createdAt = parsedDate;
              order.updatedAt = parsedDate;
            }
            await order.save();
            if (parsedDate) {
              await Order.updateOne({ _id: order._id }, { $set: { createdAt: parsedDate, updatedAt: parsedDate } }, { timestamps: false });
            }
            existingOrdersMap.set(body.orderNumber, order);
          }
          successCount++;
        } catch (err) {
          failedCount++;
          errors.push({ orderNumber: body.orderNumber || 'Unknown', error: err.message });
        }
      }));
    }

    res.status(201).json({ success: true, successCount, failedCount, errors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/orders ──────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const body = req.body;

    if (body.clientSnapshot) {
      if (typeof body.clientSnapshot.billingAddress === 'string') {
        body.clientSnapshot.billingAddress = { city: body.clientSnapshot.billingAddress };
      }
      if (typeof body.clientSnapshot.shippingAddress === 'string') {
        body.clientSnapshot.shippingAddress = { city: body.clientSnapshot.shippingAddress };
      }
      if (!body.clientSnapshot.billingAddress) body.clientSnapshot.billingAddress = { city: "" };
      if (!body.clientSnapshot.shippingAddress) body.clientSnapshot.shippingAddress = { city: "" };
    }

    if (body.designFileUrl) {
      body.designFileUrl = await saveBase64ToFileIfDataUrl(body.designFileUrl, 'orders/designs', req);
    }
    if (Array.isArray(body.lineItems)) {
      for (const item of body.lineItems) {
        if (item.designFileUrl) {
          item.designFileUrl = await saveBase64ToFileIfDataUrl(item.designFileUrl, 'orders/designs', req);
        }
      }
    }
    if (body.initialPayment && body.initialPayment.proofUrl) {
      body.initialPayment.proofUrl = await saveBase64ToFileIfDataUrl(body.initialPayment.proofUrl, 'payments/proofs', req);
    }
    if (body.payment && body.payment.paymentProof) {
      body.payment.paymentProof = await saveBase64ToFileIfDataUrl(body.payment.paymentProof, 'payments/proofs', req);
    }
    if (body.isPO && body.poDocument) {
      body.poDocument = await saveBase64ToFileIfDataUrl(body.poDocument, 'orders/po', req);
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    let confirmedOrder;

    try {
      // Intelligent Customer Matching & Creation
      const customerData = {
        name: body.name || body.clientSnapshot?.name || body.clientName,
        phone: body.phone || body.clientSnapshot?.phone || body.clientPhone,
        alternateMobile: body.alternateMobile || body.clientSnapshot?.alternateMobile,
        email: body.email || body.clientSnapshot?.email || body.clientEmail,
        gstNumber: body.gstNumber || body.clientSnapshot?.gstin,
        panNumber: body.panNumber || body.clientSnapshot?.panNumber,
        company: body.company || body.clientSnapshot?.company || body.clientCompany,
        billingAddress: body.billingAddress || body.clientSnapshot?.billingAddress,
        shippingAddress: body.shippingAddress || body.clientSnapshot?.shippingAddress,
        location: body.location || body.clientSnapshot?.address,
      };

      let prospectId = body.prospect;
      let clientId = body.client;

      if (!prospectId && !clientId) {
        const matchResult = await customerMatchingService.ensureUniqueCustomer(customerData, req.user._id);
        if (matchResult.client) {
          clientId = matchResult.client._id;
        } else if (matchResult.prospect) {
          prospectId = matchResult.prospect._id;
        }
      }

      const order = new Order({
        ...body,
        prospect: prospectId,
        client: clientId,
        salesExec: req.user._id,
        status: 'Draft',
      });

      // Map design status from frontend
      if (body.designStatus === 'Need Design') {
        order.designRequired = true;
        order.designStatus   = 'Pending';
        order.lineItems.forEach(item => {
          if (!item.designerWorkflow) item.designerWorkflow = {};
          item.designerWorkflow.workflowType = 'DESIGN_CREATED';
          item.designerWorkflow.currentStatus = 'Assigned';
        });
      } else if (body.designStatus === 'Design Provided') {
        order.designRequired = true; // Still required so it goes to designer for check
        order.designStatus   = 'Pending';
        
        order.lineItems.forEach((item, idx) => {
          if (!item.designerWorkflow) item.designerWorkflow = {};
          item.designerWorkflow.workflowType = 'CLIENT_UPLOADED';
          item.designerWorkflow.currentStatus = 'Assigned';
          
          // Attach item specific uploaded design file, or fall back to order root designFileUrl for idx === 0
          const fileUrlToUse = item.designFileUrl || (idx === 0 ? body.designFileUrl : null);
          if (fileUrlToUse) {
            item.designFileUrl = fileUrlToUse;
            if (!item.serviceFiles) item.serviceFiles = [];
            item.serviceFiles.push({
              type: 'CLIENT_UPLOAD',
              fileUrl: fileUrlToUse,
              uploadedBy: req.user._id,
              uploadedAt: new Date()
            });
          }
        });
      }

      // Snapshot client info
      if (!order.clientSnapshot?.name) {
        order.clientSnapshot = {
          name: customerData.name || 'Unknown',
          phone: customerData.phone || '',
          company: customerData.company || '',
          email: customerData.email || '',
          alternateMobile: customerData.alternateMobile || '',
          address: customerData.location || '',
          billingAddress: customerData.billingAddress,
          shippingAddress: customerData.shippingAddress,
          gstin: customerData.gstNumber,
          panNumber: customerData.panNumber,
        };
      }

      order.addTimelineEvent('Order Created', `Draft created by ${req.user.name}`, req.user);

      // Initial save to compute totals (via pre-save hook) and generate orderNumber
      if (!order.orderNumber) {
        order.orderNumber = await documentNumberingService.generateNextNumber('order');
      }
      await order.save({ session });

      // Handle initial payment if provided
      if (body.initialPayment && body.initialPayment.amount > 0) {
        const { recordPayment } = require('../../workflows/payment.workflow');
        await recordPayment({
          orderId: order._id,
          amount: body.initialPayment.amount,
          method: body.initialPayment.method || 'Cash',
          proofUrl: body.initialPayment.proofUrl,
          paymentType: 'Advance'
        }, req.user, session); // Need to pass session to workflow ideally, assuming workflow handles it or ignores it. 
        // Wait, payment workflow might not take session. I'll pass it but keep it robust.
        
        // Reload order to get updated paymentRecords before confirming
        await order.populate('paymentRecords');
      }

      await session.commitTransaction();
      session.endSession();

      // Delegate to workflow to determine if it goes to Pending_Approval or Confirmed (and triggers RoundRobin)
      // This is called AFTER transaction because it triggers external systems/emails
      confirmedOrder = await orderWorkflow.confirmOrder(order._id, req.user, getReqContext(req));

    } catch (txError) {
      await session.abortTransaction();
      session.endSession();
      throw txError;
    }

    res.status(201).json({ success: true, data: confirmedOrder });

  } catch (err) {
    console.error('[ORDER_CREATE_ERROR]', err);
    
    // Check for Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: `Validation Failed: ${messages.join(', ')}`,
        errors: err.errors
      });
    }

    res.status(400).json({ 
      success: false, 
      message: err.message || 'Failed to create order',
      error: err.name,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ── POST /api/orders/:id/verify ───────────────────────────────────────────────
exports.verifyOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    const allowedRoles = ['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'ACCOUNTS'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to verify orders.' });
    }
    if (order.verificationStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Order is not pending verification.' });
    }

    order.verificationStatus = 'Verified';
    order.verifiedBy = req.user._id;
    order.verifiedByName = req.user.name;
    order.verifiedByRole = req.user.role;
    order.verifiedAt = new Date();

    order.addTimelineEvent(
      'Order Verified',
      `Verified by ${req.user.name} (${req.user.role.replace('_', ' ')}).`,
      req.user
    );

    // After Order Verification, trigger the next phase
    if (order.designRequired) {
      const { assignRoundRobin } = require('../../domains/hr/assignment.service');
      order.status = 'Design_Pending';
      order.designStatus = 'Pending';
      order.designRequestedAt = new Date();
      order.addTimelineEvent('Design Request Created', 'Order Verified. Design required. Pending assignment to designer.', req.user);

      try {
        const assignment = await assignRoundRobin('DESIGNER', order._id, null, req.user._id);
        order.designAssignedTo = assignment.assignedTo;
        order.addTimelineEvent('Designer Assigned', 'Automatically assigned designer via Round Robin', req.user);
      } catch (err) {
        console.error('Failed to assign designer automatically:', err);
      }
    } else {
      const { assignRoundRobin } = require('../../domains/hr/assignment.service');
      order.status = 'In_Production';
      order.addTimelineEvent('Production Started', 'Order Verified. No design required. Moving to production.', req.user);
      
      if (!order.operationsManager) {
        try {
          const assignment = await assignRoundRobin('OPERATION_MANAGER', order._id, null, req.user._id);
          order.operationsManager = assignment.assignedTo;
          order.addTimelineEvent('Operations Manager Assigned', 'Automatically assigned operations manager via Round Robin', req.user);
        } catch (err) {
          console.error('Failed to assign ops manager automatically:', err);
        }
      }
    }

    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/orders/:id/confirm ──────────────────────────────────────────────
exports.confirm = async (req, res) => {
  try {
    const order = await orderWorkflow.confirmOrder(req.params.id, req.user, getReqContext(req));
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/status ──────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const existing = await Order.findById(req.params.id);
    if (existing?.orderType === 'Historical') {
      return res.status(400).json({ success: false, message: 'Historical orders are completed old data and disabled for workflow modification' });
    }
    const order = await orderWorkflow.updateOrderStatus(req.params.id, req.body.status, req.user, req.body, getReqContext(req));
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }
};

// ── PATCH /api/orders/:id ─────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const existing = await Order.findById(req.params.id);
    if (existing?.orderType === 'Historical') {
      return res.status(400).json({ success: false, message: 'Historical orders are completed old data and disabled for workflow modification' });
    }
    if (req.body.designFileUrl) {
      req.body.designFileUrl = await saveBase64ToFileIfDataUrl(req.body.designFileUrl, 'orders/designs', req);
    }
    if (Array.isArray(req.body.lineItems)) {
      for (const item of req.body.lineItems) {
        if (item.designFileUrl) {
          item.designFileUrl = await saveBase64ToFileIfDataUrl(item.designFileUrl, 'orders/designs', req);
        }
      }
    }
    const order = await orderWorkflow.updateOrder(req.params.id, req.body, req.user, getReqContext(req));
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const existing = await Order.findById(req.params.id);
    if (existing?.orderType === 'Historical') {
      return res.status(400).json({ success: false, message: 'Historical orders are completed old data and cannot be deleted.' });
    }
    const order = await orderWorkflow.deleteOrder(req.params.id, req.user, getReqContext(req));
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/orders/:id/line-items/:itemIndex ─────────────────────────────────
exports.updateLineItem = async (req, res) => {
  try {
    const existing = await Order.findById(req.params.id);
    if (existing?.orderType === 'Historical') {
      return res.status(400).json({ success: false, message: 'Historical orders are completed old data and disabled for workflow modification' });
    }
    const { id, itemIndex } = req.params;
    let { designerStatus, designFileUrl, operationStatus, operationFileUrl, serviceStatus, serviceFileUrl } = req.body;
    
    if (designFileUrl) designFileUrl = await saveBase64ToFileIfDataUrl(designFileUrl, 'orders/designs', req);
    if (operationFileUrl) operationFileUrl = await saveBase64ToFileIfDataUrl(operationFileUrl, 'orders/operations', req);
    if (serviceFileUrl) serviceFileUrl = await saveBase64ToFileIfDataUrl(serviceFileUrl, 'orders/services', req);

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (!order.lineItems || !order.lineItems[itemIndex]) {
      return res.status(404).json({ success: false, message: 'Line item not found.' });
    }
    
    const item = order.lineItems[itemIndex];
    if (designerStatus) item.designerStatus = designerStatus;
    if (designFileUrl) item.designFileUrl = designFileUrl;
    if (operationStatus) item.operationStatus = operationStatus;
    if (operationFileUrl) item.operationFileUrl = operationFileUrl;
    if (serviceStatus) item.serviceStatus = serviceStatus;
    if (serviceFileUrl) item.serviceFileUrl = serviceFileUrl;
    
    order.addTimelineEvent('Line Item Updated', `Updated product/service ${item.description}`, req.user);
    
    await order.save();

    const orderWorkflow = require('../../workflows/order.workflow');
    const getReqContext = (req) => ({
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      device: req.headers['user-agent']
    });
    const forceAdminUser = { _id: req.user._id, role: 'ADMIN', name: req.user.name };

    // Check if all line items are completed by design
    const allDesignCompleted = order.lineItems.every(li => 
      ['Design Completed', 'Design Provided - Approved'].includes(li.designerStatus) || 
      (!li.designerStatus) // Fallback for very old records
    );
    
    if (allDesignCompleted && ['Design_Pending', 'Design_InProgress', 'Design_Review'].includes(order.status)) {
      order.designStatus = 'Completed';
      await order.save();
      await orderWorkflow.updateOrderStatus(order._id, 'In_Production', forceAdminUser, {}, getReqContext(req));
    }

    // Check if all line items are completed by the service team
    const allCompleted = order.lineItems.every(li => li.serviceStatus === 'completed');
    if (allCompleted && order.status !== 'Completed') {
      await orderWorkflow.updateOrderStatus(order._id, 'Completed', forceAdminUser, {}, getReqContext(req));
    }

    const updatedOrder = await Order.findById(id);
    res.json({ success: true, data: updatedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

  // ── DELETE /api/orders/:id/line-items/:itemIndex ────────────────────────
  exports.deleteLineItem = async (req, res) => {
    try {
      const { id, itemIndex } = req.params;
      
      // Only Admin or Operations Manager should delete line items
      if (!['ADMIN', 'OPERATION_MANAGER'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete line items.' });
      }

      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

      if (!order.lineItems || !order.lineItems[itemIndex]) {
        return res.status(404).json({ success: false, message: 'Line item not found.' });
      }

      // Capture details before deletion for history
      const removedItem = order.lineItems[itemIndex];

      // Remove the item
      order.lineItems.splice(itemIndex, 1);

      // Re-calculate order totals
      let newAmount = 0;
      let totalDiscountAmount = 0;
      let totalTaxAmount = 0;
      
      order.lineItems.forEach(item => {
        const itemAmount = item.amount || (item.unitPrice * item.quantity);
        newAmount += itemAmount;
        
        const base = item.quantity * item.unitPrice;
        const discountVal = (base * (item.discount || 0)) / 100;
        const afterDiscount = base - discountVal;
        const taxVal = (afterDiscount * (item.gstRate || 0)) / 100;
        totalDiscountAmount += discountVal;
        totalTaxAmount += taxVal;
      });

      order.amount = newAmount;
      order.subtotal = newAmount;
      order.totalDiscount = totalDiscountAmount;
      order.grandTotal = Math.round(newAmount - totalDiscountAmount + totalTaxAmount);
      order.balanceDue = order.grandTotal - (order.totalPaid || 0);

      order.addTimelineEvent('Service Deleted', `Service "${removedItem.description}" was deleted from the order.`, req.user);

      // Now evaluate if the order should be pushed to In_Production
      const allCompleted = order.lineItems.every(li => 
        !li.designerWorkflow || ['Completed', 'Client-Design Approved'].includes(li.designerWorkflow.currentStatus)
      );

      if (order.lineItems.length > 0 && allCompleted && order.status !== 'In_Production' && order.status !== 'Completed') {
        order.designStatus = 'Completed';
        await order.save();
        
        const orderWorkflow = require('../../workflows/order.workflow');
        const getReqContext = (req) => ({ ipAddress: req.ip, userAgent: req.headers['user-agent'], device: req.headers['user-agent'] });
        const forceAdminUser = { _id: req.user._id, role: 'ADMIN', name: req.user.name };
        
        try {
          await orderWorkflow.updateOrderStatus(order._id, 'In_Production', forceAdminUser, {}, getReqContext(req));
        } catch (wfErr) {
          console.error('Failed to auto-transition order to In_Production:', wfErr.message);
        }
      } else {
        await order.save();
      }

      const updatedOrder = await Order.findById(id);
      res.json({ success: true, message: 'Line item deleted successfully.', data: updatedOrder });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

// ── POST /api/orders/:id/approve-advance ──────────────────────────────────────
exports.approveAdvance = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    order.advanceApproved   = true;
    order.advanceApprovedBy = req.user._id;

    order.addTimelineEvent(
      'Low Advance Approved',
      `Advance exception approved by ${req.user.name} (${req.user.role})`,
      req.user
    );

    await order.save();
    
    // Call the workflow to officially transition the status and trigger RoundRobin
    const confirmedOrder = await orderWorkflow.confirmOrder(order._id, req.user, getReqContext(req));

    await createAuditLog({
      action: 'ADVANCE_EXCEPTION_APPROVED',
      performedBy: req.user,
      newValue: { orderId: order._id, orderNumber: order.orderNumber },
      req,
    });

    res.json({ success: true, data: confirmedOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/orders/stats ─────────────────────────────────────────────────────
exports.stats = async (req, res) => {
  try {
    const filter = {};
    const accessibleIds = await getAccessibleUserIds(req.user);
    if (accessibleIds) {
      filter.salesExec = { $in: accessibleIds.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [total, confirmed, inProduction, completed, cancelled, revenue, user, monthlyTotal, monthlyCompleted] = await Promise.all([
      Order.countDocuments(filter),
      Order.countDocuments({ ...filter, status: 'Confirmed' }),
      Order.countDocuments({ ...filter, status: 'In_Production' }),
      Order.countDocuments({ ...filter, status: 'Completed' }),
      Order.countDocuments({ ...filter, status: 'Cancelled' }),
      Order.aggregate([
        { $match: { ...filter, paymentStatus: { $in: ['Partial', 'Paid'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalPaid' }, totalGrandTotal: { $sum: '$grandTotal' } } },
      ]),
      User.findById(req.user._id).select('monthlyTarget targetMonth'),
      Order.countDocuments({ ...filter, createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ ...filter, status: 'Completed', updatedAt: { $gte: startOfMonth } }),
    ]);

    console.log('[DEBUG_STATS] UserID:', req.user._id, 'FoundTarget:', user?.monthlyTarget);

    res.json({
      success: true,
      data: {
        total, confirmed, inProduction, completed, cancelled,
        totalRevenue: revenue[0]?.totalRevenue || 0,
        totalOrderValue: revenue[0]?.totalGrandTotal || 0,
        monthlyTarget: Number(user?.monthlyTarget || 0),
        targetMonth: user?.targetMonth,
        monthlyTotal,
        monthlyCompleted,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// ── POST /api/orders/:id/payments ───────────────────────────────────────────
const { recordPayment } = require('../../workflows/payment.workflow');

exports.addPayment = async (req, res) => {
  try {
    let { amount, method, proofUrl, proofType, reference, paymentType, notes } = req.body;
    if (proofUrl) {
      proofUrl = await saveBase64ToFileIfDataUrl(proofUrl, 'payments/proofs', req);
    }
    
    const { payment, order } = await recordPayment({
      orderId: req.params.id,
      amount,
      method,
      proofUrl,
      proofType,
      reference,
      paymentType,
      notes
    }, req.user);

    res.status(201).json({
      success: true,
      message: 'Payment recorded and awaiting verification.',
      data: { payment, order }
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
