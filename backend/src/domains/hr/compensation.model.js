const mongoose = require('mongoose');

const compensationSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['INCENTIVE', 'COMMISSION', 'BONUS', 'DEDUCTION', 'REIMBURSEMENT'],
      required: true,
    },
    subType: { type: String }, // e.g. "Travel", "Late Penalty", "Festival Bonus"
    amount: { type: Number, required: true },
    reason: { type: String },
    date: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['SUBMITTED', 'MANAGER_APPROVED', 'HR_APPROVED', 'COMPLETED', 'REJECTED'],
      default: 'SUBMITTED',
    },
    target: { type: Number }, // for commissions
    achievement: { type: Number }, // for commissions
    managerApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hrApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Compensation', compensationSchema);
