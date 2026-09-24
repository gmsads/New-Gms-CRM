const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  invoiceType: { type: String, enum: ['GST', 'NON_GST'], required: true },
  gstType: { type: String, enum: ['INTRA_STATE', 'INTER_STATE', null] },
  
  financialYear: { type: String, required: true },
  series: { type: String, required: true },

  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },

  invoiceDate: { type: Date, required: true, default: Date.now },

  status: { type: String, enum: ['ISSUED', 'CANCELLED'], default: 'ISSUED' },

  // Historical snapshots guaranteed not to change
  supplierSnapshot: {
    name: String,
    gstin: String,
    address: String,
    state: String,
    stateCode: String
  },

  customerSnapshot: {
    name: String,
    company: String,
    gstin: String,
    panNumber: String,
    address: String,
    state: String,
    stateCode: String,
    phone: String,
    email: String
  },

  placeOfSupply: { type: String },

  lineItems: [{
    description: String,
    quantity: Number,
    rate: Number,
    discount: Number,
    taxableValue: Number,
    gstRate: Number,
    gstAmount: Number,
    hsnSacCode: String,
    lineTotal: Number
  }],

  // Financial snapshot
  subtotal: { type: Number, required: true },
  taxableAmount: { type: Number, required: true },

  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 },
  igstAmount: { type: Number, default: 0 },

  totalGST: { type: Number, required: true },
  grandTotal: { type: Number, required: true },

  // Audit trails
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issuedAt: { type: Date, default: Date.now },

  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancelledAt: { type: Date },
  cancellationReason: { type: String }

}, { timestamps: true });

// Indexes for optimized searching and reporting
invoiceSchema.index({ order: 1 });
invoiceSchema.index({ invoiceType: 1, financialYear: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ invoiceDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
