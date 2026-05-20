const mongoose = require('mongoose');

const quotationItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, default: 1 },
  unitCost: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  isCustomPrice: { type: Boolean, default: false },
  originalPrice: { type: Number } // Store the system price if overridden
});

const quotationSchema = new mongoose.Schema({
  quotationId: { type: String, unique: true },
  prospect: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect', required: true },
  executive: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  items: [quotationItemSchema],
  
  subtotal: { type: Number, required: true },
  discount: {
    type: { type: String, enum: ['FLAT', 'PERCENT'], default: 'FLAT' },
    value: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  
  tax: {
    enabled: { type: Boolean, default: true },
    rate: { type: Number, default: 18 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  },
  
  additionalCharges: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true }
  }],
  
  totalAmount: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['Draft', 'Sent', 'Viewed', 'Approved', 'Rejected', 'Converted to Order'],
    default: 'Draft'
  },
  
  requiresApproval: { type: Boolean, default: false },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  templateSnapshot: { type: mongoose.Schema.Types.Mixed }, // Store template state at time of creation
  
  validUntil: { type: Date },
  terms: { type: String },
  notes: { type: String },
  
  pdfUrl: { type: String },
  whatsappSentAt: { type: Date }
}, { timestamps: true, optimisticConcurrency: true });

const softDeletePlugin = require('../../../utils/softDelete.plugin');
quotationSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('Quotation', quotationSchema);
