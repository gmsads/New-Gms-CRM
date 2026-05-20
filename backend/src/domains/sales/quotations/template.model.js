const mongoose = require('mongoose');

const quotationTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Default Template' },
  isDefault: { type: Boolean, default: false },
  
  companyName: { type: String, required: true },
  logoUrl: { type: String },
  address: { type: String },
  gstNumber: { type: String },
  panNumber: { type: String },
  
  bankDetails: {
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    branch: { type: String },
  },
  
  termsAndConditions: [{ type: String }],
  footerText: { type: String },
  authorizedSignatureUrl: { type: String },
  
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('QuotationTemplate', quotationTemplateSchema);
