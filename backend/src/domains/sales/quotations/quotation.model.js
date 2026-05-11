const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, default: 1 },
  unit: { type: String, default: 'pcs' },
  unitPrice: { type: Number, required: true },
  discount: { type: Number, default: 0 }, // percentage
  gstRate: { type: Number, default: 18 }, // percentage
  amount: { type: Number }, // computed
}, { _id: false });

const quotationSchema = new mongoose.Schema(
  {
    quotationNumber: { type: String, unique: true }, // QT-2026-001
    prospect: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect' },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

    lineItems: [lineItemSchema],

    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalGST: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired'],
      default: 'Draft',
    },

    validUntil: { type: Date },
    sentVia: { type: String, enum: ['WhatsApp', 'Email', 'Both', 'None'], default: 'None' },
    sentAt: { type: Date },

    notes: { type: String },
    terms: { type: String, default: '50% advance required before work commencement.' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-generate quotation number before save
quotationSchema.pre('save', async function () {
  if (this.isNew && !this.quotationNumber) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
  }
});

module.exports = mongoose.model('Quotation', quotationSchema);
