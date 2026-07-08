const mongoose = require('mongoose');

const quotationTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Default Template' },
  isDefault: { type: Boolean, default: false },
  
  companyName: { type: String, required: true },
  logoUrl: { type: String },
  address: { type: String },
  gstNumber: { type: String },
  gstin: { type: String },
  panNumber: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  email: { type: String },
  mobile: { type: String },
  website: { type: String },
  
  bankDetails: {
    accountName: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    branch: { type: String },
  },
  
  qrCode: {
    enabled: { type: Boolean, default: false },
    upiId: { type: String }
  },
  defaultValidityDays: { type: Number, default: 15 },
  
  termsAndConditions: [{ type: String }],
  footerText: { type: String },
  footerNotes: { type: String },
  authorizedSignatureUrl: { type: String },
  
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('QuotationTemplate', quotationTemplateSchema);
