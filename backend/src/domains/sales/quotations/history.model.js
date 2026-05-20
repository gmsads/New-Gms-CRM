const mongoose = require('mongoose');

const quotationHistorySchema = new mongoose.Schema({
  quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  action: { 
    type: String, 
    enum: ['CREATED', 'UPDATED', 'STATUS_CHANGED', 'PDF_GENERATED', 'SENT_WHATSAPP', 'PRICE_OVERRIDDEN', 'DISCOUNT_CHANGED'],
    required: true
  },
  previousStatus: { type: String },
  newStatus: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('QuotationHistory', quotationHistorySchema);
