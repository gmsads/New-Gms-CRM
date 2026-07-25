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
  regNumber: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  email: { type: String },
  mobile: { type: String },
  alternateMobile: { type: String },
  website: { type: String },
  tagline: { type: String },
  city: { type: String },
  state: { type: String },
  country: { type: String, default: 'India' },
  pincode: { type: String },
  cin: { type: String },
  msme: { type: String },
  
  // Branding Extras
  sealUrl: { type: String },
  watermarkUrl: { type: String },
  footerLogoUrl: { type: String },
  
  bankDetails: {
    accountName: { type: String },
    bankName: { type: String },
    accountNumber: { type: String },
    ifscCode: { type: String },
    branch: { type: String },
  },
  
  // Phase 1: Multiple Bank Accounts Master
  bankAccounts: [{
    accountName: { type: String },
    bankName: { type: String },
    branch: { type: String },
    accountNumber: { type: String },
    ifsc: { type: String },
    upiId: { type: String },
    qrCodeUrl: { type: String },
    active: { type: Boolean, default: true },
    isDefault: { type: Boolean, default: false }
  }],
  
  qrCode: {
    enabled: { type: Boolean, default: false },
    upiId: { type: String }
  },
  defaultValidityDays: { type: Number, default: 15 },
  
  termsAndConditions: [{ type: String }],
  footerText: { type: String },
  footerNotes: { type: String },
  authorizedSignatureUrl: { type: String },

  // Phase 1: Quotation Settings
  quotationSettings: {
    prefix: { type: String, default: 'QT-' },
    startNumber: { type: Number, default: 1000 },
    validityDays: { type: Number, default: 15 },
    termsAndConditions: { type: String },
    footerText: { type: String },
    defaultNotes: { type: String }
  },

  // Phase 1: Invoice Settings
  invoiceSettings: {
    prefix: { type: String, default: 'INV-' },
    startNumber: { type: Number, default: 1000 },
    termsAndConditions: { type: String },
    footerText: { type: String },
    defaultBankAccountId: { type: mongoose.Schema.Types.ObjectId }
  },

  // Phase 1: Generic Document Numbering
  documentNumbering: {
    quotation: {
      prefix: { type: String, default: 'QT-' },
      startNumber: { type: Number, default: 1000 }
    },
    invoice: {
      prefix: { type: String, default: 'INV-' },
      startNumber: { type: Number, default: 1000 }
    },
    order: {
      prefix: { type: String, default: 'ORD-' },
      startNumber: { type: Number, default: 1000 }
    },
    receipt: {
      prefix: { type: String, default: 'REC-' },
      startNumber: { type: Number, default: 1000 }
    },
    purchaseOrder: {
      prefix: { type: String, default: 'PO-' },
      startNumber: { type: Number, default: 1000 }
    },
    deliveryChallan: {
      prefix: { type: String, default: 'DC-' },
      startNumber: { type: Number, default: 1000 }
    }
  },

  // Phase 7: Tax & GST Settings
  taxSettings: {
    enableGst: { type: Boolean, default: true },
    defaultGstRate: { type: Number, default: 18 },
    hsnCode: { type: String },
    sacCode: { type: String },
    stateCode: { type: String },
    gstSlabs: [{
      rate: { type: Number },
      active: { type: Boolean, default: true },
      description: { type: String }
    }]
  },
  
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('QuotationTemplate', quotationTemplateSchema);
