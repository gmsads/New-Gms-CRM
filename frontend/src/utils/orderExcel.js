import * as XLSX from 'xlsx';

export const ORDER_EXCEL_HEADERS = [
  'Serial Number',
  'Order ID',
  'Order Date',
  'Employee Name',
  'Business Name',
  'Client Name',
  'Contact Number',
  'Business Address',
  'Lead Source',
  'Client Type',
  'GST Number',
  'Requirements',
  'Qty',
  'Rate',
  'Total',
  'Discount',
  'Final Amount',
  'Delivery Date',
  'Order Status',
  'Advance',
  'Advance Date',
  'Pending Balance',
  'Payment Date',
  'Payment Method',
  'Cheque Number',
  'Closed By'
];

export const exportOrdersToExcel = (orders = [], filename = 'GMS_Orders_Export.xlsx') => {
  if (!orders || orders.length === 0) {
    alert('No orders to export.');
    return;
  }

  const rows = [];
  const merges = [];
  let currentRowIdx = 1; // Row 0 is HEADERS

  orders.forEach((o, index) => {
    const serialNum = index + 1;
    const orderId = o.orderNumber || o.id || o._id || '';
    const orderDate = o.createdAt || o.date ? new Date(o.createdAt || o.date).toLocaleDateString('en-CA') : '';
    const empName = o.salesExec?.name || (typeof o.salesExec === 'string' ? o.salesExec : '') || o.closedBy || o['Employee Name'] || '';
    const businessName = o.clientSnapshot?.company || o.company || o['Business Name'] || o.clientSnapshot?.name || '';
    const clientName = o.clientSnapshot?.name || o.clientName || o['Client Name'] || '';
    const contactNum = o.clientSnapshot?.phone || o.phone || o['Contact Number'] || '';
    const businessAddress = o.deliveryAddress || o.clientSnapshot?.address || o.address || o['Business Address'] || '';
    const leadSource = o.prospect?.source || o.leadSource || o['Lead Source'] || 'Direct';
    const clientType = o.orderType || o.clientType || o['Client Type'] || 'Retail';
    const gstNum = o.clientSnapshot?.gstNumber || o.gstNumber || o['GST Number'] || '';

    const total = o.subtotal || o.grandTotal || o.amount || o['Total'] || 0;
    const discount = o.totalDiscount || o.discount || o['Discount'] || 0;
    const finalAmount = o.grandTotal || o.amount || o['Final Amount'] || total || 0;
    const deliveryDate = o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString('en-CA') : (o['Delivery Date'] || '');
    const orderStatus = o.status || o['Order Status'] || 'Completed';

    // Payment Calculations
    const paymentRecs = Array.isArray(o.paymentRecords) ? o.paymentRecords : [];
    const advanceRecord = paymentRecs.find(p => p.notes === 'Advance Payment' || p.paymentType === 'Advance') || paymentRecs[0];
    const advance = o.advancePaid !== undefined ? o.advancePaid : (advanceRecord ? advanceRecord.amount : (o['Advance'] || 0));
    const advanceDate = advanceRecord && (advanceRecord.receivedAt || advanceRecord.createdAt) ? new Date(advanceRecord.receivedAt || advanceRecord.createdAt).toLocaleDateString('en-CA') : (o['Advance Date'] || orderDate);
    const pendingBalance = o.balanceDue !== undefined ? o.balanceDue : (o['Pending Balance'] !== undefined ? o['Pending Balance'] : Math.max(0, finalAmount - (o.totalPaid || 0)));

    const verifiedPayments = paymentRecs.filter(p => p.status === 'Verified' || !p.status);
    const lastPayment = verifiedPayments.length > 0 ? verifiedPayments[verifiedPayments.length - 1] : paymentRecs[0];
    const paymentDate = lastPayment && (lastPayment.receivedAt || lastPayment.createdAt) ? new Date(lastPayment.receivedAt || lastPayment.createdAt).toLocaleDateString('en-CA') : (o['Payment Date'] || advanceDate || orderDate);
    const paymentMethod = lastPayment ? lastPayment.method : (o.paymentMethod || o['Payment Method'] || 'Bank Transfer');
    const chequeNum = lastPayment?.chequeNumber || o.chequeNumber || o['Cheque Number'] || '';
    const closedBy = empName || o['Closed By'] || '';

    const lineItems = Array.isArray(o.lineItems) && o.lineItems.length > 0 ? o.lineItems : [{
      description: o.description || o.orderType || o['Requirements'] || 'General Order',
      quantity: o.quantity || o['Qty'] || 1,
      unitPrice: o.unitPrice || o['Rate'] || finalAmount
    }];

    const startRow = currentRowIdx;
    const endRow = startRow + lineItems.length - 1;

    lineItems.forEach((item, itemIdx) => {
      const isFirst = itemIdx === 0;
      rows.push([
        isFirst ? serialNum : '',
        isFirst ? orderId : '',
        isFirst ? orderDate : '',
        isFirst ? empName : '',
        isFirst ? businessName : '',
        isFirst ? clientName : '',
        isFirst ? contactNum : '',
        isFirst ? businessAddress : '',
        isFirst ? leadSource : '',
        isFirst ? clientType : '',
        isFirst ? gstNum : '',
        item.description || 'Requirement',
        item.quantity || 1,
        item.unitPrice || 0,
        isFirst ? total : '',
        isFirst ? discount : '',
        isFirst ? finalAmount : '',
        isFirst ? deliveryDate : '',
        isFirst ? orderStatus : '',
        isFirst ? advance : '',
        isFirst ? advanceDate : '',
        isFirst ? pendingBalance : '',
        isFirst ? paymentDate : '',
        isFirst ? paymentMethod : '',
        isFirst ? chequeNum : '',
        isFirst ? closedBy : ''
      ]);
      currentRowIdx++;
    });

    if (lineItems.length > 1) {
      // Columns to merge: all columns except 11 (Requirements), 12 (Qty), 13 (Rate)
      const colsToMerge = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
      colsToMerge.forEach(colIdx => {
        merges.push({ s: { r: startRow, c: colIdx }, e: { r: endRow, c: colIdx } });
      });
    }
  });

  const worksheet = XLSX.utils.aoa_to_sheet([ORDER_EXCEL_HEADERS, ...rows]);
  if (merges.length > 0) {
    worksheet['!merges'] = merges;
  }

  // Adjust column widths
  worksheet['!cols'] = ORDER_EXCEL_HEADERS.map(hdr => ({ wch: Math.max(hdr.length + 3, 16) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
  XLSX.writeFile(workbook, filename);
};

export const downloadOrderTemplate = (filename = 'GMS_Orders_Template.xlsx') => {
  const sampleOrders = [
    {
      orderNumber: 'ORD-2026-0001',
      createdAt: '2026-06-15',
      salesExec: { name: 'Rajesh Sharma' },
      clientSnapshot: { company: 'Apex Enterprises Pvt Ltd', name: 'Suresh Verma', phone: '9876543210', gstNumber: '27AABCT1234E1Z5' },
      deliveryAddress: '402, Business Park, Andheri East, Mumbai',
      leadSource: 'Google Ads',
      orderType: 'New Sale',
      lineItems: [
        { description: 'Corporate Website Development', quantity: 1, unitPrice: 45000 },
        { description: 'Logo & Brand Identity Package', quantity: 1, unitPrice: 15000 },
        { description: '1 Year Hosting & SSL Certificate', quantity: 1, unitPrice: 8000 }
      ],
      subtotal: 68000,
      totalDiscount: 3000,
      grandTotal: 65000,
      deliveryDate: '2026-06-30',
      status: 'Completed',
      advancePaid: 35000,
      balanceDue: 0,
      paymentRecords: [
        { amount: 35000, method: 'Bank Transfer', receivedAt: '2026-06-15', notes: 'Advance Payment' },
        { amount: 30000, method: 'Cheque', chequeNumber: 'CHQ-998877', receivedAt: '2026-06-25', notes: 'Balance Payment' }
      ]
    },
    {
      orderNumber: 'ORD-2026-0002',
      createdAt: '2026-06-18',
      salesExec: { name: 'Pooja Mehta' },
      clientSnapshot: { company: 'Zenith Retailers', name: 'Anil Gupta', phone: '9123456789', gstNumber: '07AAACG0123H1Z1' },
      deliveryAddress: '12, Connaught Circle, New Delhi',
      leadSource: 'Referral',
      orderType: 'Renewal',
      lineItems: [
        { description: 'Annual Maintenance Contract (AMC)', quantity: 1, unitPrice: 25000 }
      ],
      subtotal: 25000,
      totalDiscount: 0,
      grandTotal: 25000,
      deliveryDate: '2026-06-20',
      status: 'Completed',
      advancePaid: 25000,
      balanceDue: 0,
      paymentRecords: [
        { amount: 25000, method: 'UPI', receivedAt: '2026-06-18', notes: 'Advance Payment' }
      ]
    }
  ];

  exportOrdersToExcel(sampleOrders, filename);
};
