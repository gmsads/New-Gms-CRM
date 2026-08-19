const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // ── Links
  order:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  prospect: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect' },
  client:   { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },

  // ── Payment details
  paymentNumber: { type: String, unique: true }, // PAY-2026-0001
  amount:   { type: Number, required: true, min: 1 },
  method:   { type: String, enum: ['Cash', 'UPI', 'PhonePe', 'GPay', 'Bank Transfer', 'Cheque', 'Other'], required: true },
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
paymentSchema.pre('save', async function () {
  if (this.isNew && !this.paymentNumber) {
    const Counter = require('../../models/counter.model');
    const currentYear = new Date().getFullYear();
    const counterId = `payment-${currentYear}`;
    
    let counter = await Counter.findOne({ id: counterId });
    if (!counter) {
      // Initialize based on the highest existing Payment Number for current year
      const prefix = `PAY-${currentYear}-`;
      const regex = new RegExp(`^${prefix}\\d+$`, 'i');
      
      const lastPayment = await mongoose.model('Payment').findOne({ paymentNumber: regex })
        .collation({ locale: 'en_US', numericOrdering: true })
        .sort({ paymentNumber: -1 })
        .lean();

      let startSeq = 0;
      if (lastPayment && lastPayment.paymentNumber) {
        const match = lastPayment.paymentNumber.match(new RegExp(`^${prefix}(\\d+)$`, 'i'));
        if (match) {
          startSeq = parseInt(match[1], 10);
        }
      }
      
      try {
        await Counter.create({ id: counterId, seq: startSeq });
      } catch (err) {
        // Ignore duplicate key error if created concurrently by another request
      }
    }
    
    const updatedCounter = await Counter.findOneAndUpdate(
      { id: counterId },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    this.paymentNumber = `PAY-${currentYear}-${String(updatedCounter.seq).padStart(4, '0')}`;
  }
});

paymentSchema.index({ order: 1 });
paymentSchema.index({ collectedBy: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
