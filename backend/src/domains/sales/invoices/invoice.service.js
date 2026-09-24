const Invoice = require('./invoice.model');
const InvoiceSequence = require('./invoiceSequence.model');
const { getFinancialYear } = require('../../../utils/financialYear.helper');
const Template = require('../quotations/template.model');
const mongoose = require('mongoose');

class InvoiceService {
  /**
   * Generates a unique, strictly sequential invoice number automatically.
   */
  async generateSequenceNumber(invoiceType, financialYear) {
    const template = await Template.findOne({ isDefault: true }).lean();
    
    let prefix = '';
    let seriesCode = '';
    let startNumber = 1000;
    
    if (invoiceType === 'GST') {
      prefix = template?.taxSettings?.gstPrefix || 'GST/';
      seriesCode = 'GST';
      startNumber = template?.taxSettings?.gstStartNumber || 1;
    } else {
      prefix = template?.taxSettings?.nonGstPrefix || 'NG/';
      seriesCode = 'NON_GST';
      startNumber = template?.taxSettings?.nonGstStartNumber || 1;
    }

    // Atomically find and increment the counter
    const sequence = await InvoiceSequence.findOneAndUpdate(
      { financialYear, series: seriesCode },
      { $setOnInsert: { lastNumber: startNumber - 1 } },
      { new: true, upsert: true }
    );

    const updatedSequence = await InvoiceSequence.findOneAndUpdate(
      { financialYear, series: seriesCode },
      { $inc: { lastNumber: 1 } },
      { new: true }
    );

    const paddedNumber = String(updatedSequence.lastNumber).padStart(5, '0');
    return `${prefix}${financialYear}/${paddedNumber}`;
  }

  /**
   * Determines GST classification (Intra vs Inter state)
   */
  determineGstClassification(supplierStateCode, customerStateCode, placeOfSupply, supplierStateName) {
    if (!customerStateCode) {
      // Unregistered B2C logic: check place of supply text vs supplier state text
      const pos = String(placeOfSupply || '').toLowerCase();
      const sName = String(supplierStateName || '').toLowerCase();
      if (pos.includes(sName)) return 'INTRA_STATE';
      return 'INTER_STATE';
    }
    
    return customerStateCode === supplierStateCode ? 'INTRA_STATE' : 'INTER_STATE';
  }

  /**
   * Issue a new invoice safely. Checks if one already exists for the order.
   */
  async issueInvoice(order, user) {
    // 1. Check if invoice already exists
    const existing = await Invoice.findOne({ order: order._id, status: 'ISSUED' });
    if (existing) {
      return existing; // Duplicate protection
    }

    // 2. Fetch Supplier Snapshot
    const template = await Template.findOne({ isDefault: true }).lean();
    const supplierGst = template?.gstin || '36AAQFG7654Q2ZB';
    const supplierStateCode = supplierGst.replace(/\D/g, '').slice(0, 2) || '36';
    const supplierStateName = supplierStateCode === '36' ? 'Telangana' : (template?.state || 'Telangana');

    // 3. Fetch Customer Snapshot
    const cSnap = order.clientSnapshot || {};
    const clientGst = cSnap.gstin || cSnap.gstNumber || order.gstNumber || '';
    const clientStateCode = clientGst ? clientGst.replace(/\D/g, '').slice(0, 2) : '';
    const placeOfSupply = cSnap.placeOfSupply || cSnap.state || order.state || 'Telangana';

    // 4. Mathematical derivations
    const totalGST = Number(order.totalGST || 0);
    const invoiceType = totalGST > 0 ? 'GST' : 'NON_GST';
    const gstType = invoiceType === 'GST' ? this.determineGstClassification(supplierStateCode, clientStateCode, placeOfSupply, supplierStateName) : null;
    
    // 5. Build line items
    let subtotal = 0;
    const lineItems = (order.lineItems || []).map(li => {
      const q = Number(li.quantity || 1);
      const r = Number(li.unitPrice || 0);
      const amount = q * r;
      subtotal += amount;
      
      const rate = Number(li.gstRate || 0);
      const gstAmt = amount * (rate / 100);

      return {
        description: li.description || 'Service',
        quantity: q,
        rate: r,
        discount: Number(li.discount || 0),
        taxableValue: amount,
        gstRate: rate,
        gstAmount: gstAmt,
        hsnSacCode: li.hsnSacCode || null,
        lineTotal: amount + gstAmt
      };
    });

    const calculatedSubtotal = order.subtotal || subtotal;
    const grandTotal = order.grandTotal || (calculatedSubtotal + totalGST);

    let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
    if (gstType === 'INTRA_STATE') {
      cgstAmount = totalGST / 2;
      sgstAmount = totalGST / 2;
    } else if (gstType === 'INTER_STATE') {
      igstAmount = totalGST;
    }

    // 6. Generate Identity
    const invoiceDate = new Date();
    const financialYear = getFinancialYear(invoiceDate);
    const invoiceNumber = await this.generateSequenceNumber(invoiceType, financialYear);

    // 7. Persist Snapshot
    const invoice = new Invoice({
      invoiceNumber,
      invoiceType,
      gstType,
      financialYear,
      series: invoiceType === 'GST' ? 'GST' : 'NON_GST',
      order: order._id,
      invoiceDate,
      status: 'ISSUED',
      
      supplierSnapshot: {
        name: template?.companyName || 'Global Marketing Solutions',
        gstin: supplierGst,
        address: template?.address || '',
        state: supplierStateName,
        stateCode: supplierStateCode
      },
      customerSnapshot: {
        name: cSnap.name || '',
        company: cSnap.company || '',
        gstin: clientGst,
        panNumber: cSnap.panNumber || '',
        address: cSnap.address || cSnap.billingAddress?.city || '',
        state: placeOfSupply,
        stateCode: clientStateCode,
        phone: cSnap.phone || '',
        email: cSnap.email || ''
      },
      placeOfSupply,
      lineItems,
      
      subtotal: calculatedSubtotal,
      taxableAmount: calculatedSubtotal,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalGST,
      grandTotal,
      
      issuedBy: user._id,
      issuedAt: invoiceDate
    });

    await invoice.save();
    return invoice;
  }
}

module.exports = new InvoiceService();
