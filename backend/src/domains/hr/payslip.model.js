const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    basicSalary: { type: Number, required: true, default: 0 },
    allowances: { type: Number, default: 0 },
    incentives: { type: Number, default: 0 },
    salesCommission: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    grossEarnings: { type: Number, required: true },
    netPay: { type: Number, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'GENERATED', 'EMAILED'],
      default: 'GENERATED',
    },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payslip', payslipSchema);
