const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // ── Links
  order:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  prospect: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect' },
  client:   { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

  // ── Payment details
  paymentNumber: { type: String, unique: true }, // PAY-2026-0001
  amount:   { type: Number, required: true, min: 1 },
  method:   { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque'], required: true },
  reference:{ type: String }, // UPI txn ID / cheque number / bank ref

  // ── Proof (mandatory)
  proofUrl:  { type: String, required: true },
  proofType: { type: String, enum: ['Screenshot', 'Receipt', 'Cheque_Image', 'Bank_Statement'] },

  // ── Collected by Sales Exec
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  collectedAt: { type: Date, default: Date.now },

  // ── Verification (Manager / Admin)
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending',
  },
  verifiedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt:    { type: Date },
  rejectionNote: { type: String },

  // ── Payment type
  paymentType: {
    type: String,
    enum: ['Advance', 'Partial', 'Final', 'Refund'],
    default: 'Partial',
  },

  notes: { type: String },

}, { timestamps: true });

// Auto-generate payment number
paymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.paymentNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    this.paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

paymentSchema.index({ order: 1 });
paymentSchema.index({ collectedBy: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
