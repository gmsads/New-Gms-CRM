const mongoose = require('mongoose');

const invoiceSequenceSchema = new mongoose.Schema({
  financialYear: { type: String, required: true }, // e.g., '26-27'
  series: { type: String, required: true }, // e.g., 'GST' or 'NON_GST'
  lastNumber: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure concurrency safety and uniqueness per series per financial year
invoiceSequenceSchema.index({ financialYear: 1, series: 1 }, { unique: true });

module.exports = mongoose.model('InvoiceSequence', invoiceSequenceSchema);
