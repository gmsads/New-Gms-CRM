const mongoose = require('mongoose');

const vendorPaymentSchema = new mongoose.Schema({
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorAssignment' }, // Optional, can be bulk payment
  
  amount: { type: Number, required: true },
  paymentType: {
    type: String,
    enum: ['Advance', 'Final', 'Milestone', 'Ad-hoc'],
    default: 'Final'
  },
  
  status: {
    type: String,
    enum: ['Pending', 'Partial', 'Paid', 'Overdue'],
    default: 'Pending'
  },
  
  paymentMethod: {
    type: String,
    enum: ['Bank Transfer', 'Cash', 'UPI', 'Cheque', 'Other']
  },
  
  transactionId: { type: String },
  paymentProofUrl: { type: String },
  
  dueDate: { type: Date },
  paidDate: { type: Date },
  
  notes: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const softDeletePlugin = require('../../utils/softDelete.plugin');
vendorPaymentSchema.plugin(softDeletePlugin);

module.exports = mongoose.model('VendorPayment', vendorPaymentSchema);
