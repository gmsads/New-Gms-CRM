const mongoose = require('mongoose');

/**
 * HR Policy Model
 * Tracks probation reviews, exit management, and salary change requests.
 * All salary changes require Admin approval before taking effect.
 */
const hrPolicySchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    policyType: {
      type: String,
      enum: ['PROBATION_REVIEW', 'EXIT', 'SALARY_CHANGE', 'LEAVE_BALANCE_RESET'],
      required: true,
    },

    // ── Probation ──────────────────────────────────────────
    probationDetails: {
      startDate: { type: Date },
      endDate: { type: Date },
      reviewDate: { type: Date },
      outcome: { type: String, enum: ['EXTENDED', 'CONFIRMED', 'TERMINATED'] },
      reviewNotes: { type: String },
    },

    // ── Exit ───────────────────────────────────────────────
    exitDetails: {
      resignationDate: { type: Date },
      lastWorkingDate: { type: Date },
      exitType: { type: String, enum: ['RESIGNED', 'TERMINATED', 'RETIRED', 'CONTRACT_ENDED'] },
      reason: { type: String },
      exitInterviewCompleted: { type: Boolean, default: false },
      noticePeriodWaived: { type: Boolean, default: false },
      settlementStatus: { type: String, enum: ['PENDING', 'PROCESSED', 'COMPLETED'] },
    },

    // ── Salary change ──────────────────────────────────────
    salaryDetails: {
      currentSalary: { type: Number },
      proposedSalary: { type: Number },
      changeReason: { type: String },
      effectiveDate: { type: Date },
    },

    // ── Leave balance reset ────────────────────────────────
    leaveBalanceDetails: {
      year: { type: Number },
      balances: {
        CASUAL: { type: Number },
        SICK: { type: Number },
        ANNUAL: { type: Number },
        UNPAID: { type: Number },
      },
    },

    // ── Governance ────────────────────────────────────────
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'],
      default: 'DRAFT',
    },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

hrPolicySchema.index({ employee: 1, policyType: 1 });
hrPolicySchema.index({ status: 1, policyType: 1 });

module.exports = mongoose.model('HRPolicy', hrPolicySchema);
