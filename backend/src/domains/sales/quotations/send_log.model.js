const mongoose = require('mongoose');

const quotationSendLogSchema = new mongoose.Schema({
  quotation: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  sentVia: { type: String, enum: ['WHATSAPP', 'EMAIL', 'SMS'], required: true },
  sentTo: { type: String, required: true }, // Phone or Email
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
  errorMessage: { type: String },
  messagePreview: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('QuotationSendLog', quotationSendLogSchema);
