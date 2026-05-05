const mongoose = require('mongoose');

// Leave type limits (per year) — enforced at controller level
const LEAVE_LIMITS = {
  CASUAL: 12,
  SICK: 12,
  ANNUAL: 18,
  UNPAID: 999, // unlimited but tracked
  MATERNITY: 180,
  PATERNITY: 15,
};

const leaveSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Leave details ──────────────────────────────────────
    leaveType: {
      type: String,
      enum: Object.keys(LEAVE_LIMITS),
      required: true,
    },
    fromDate: { type: Date, required: true },
    toDate: { type: Date, required: true },
    totalDays: { type: Number }, // computed at save
    reason: { type: String, required: true },

    // ── Multi-level review status ──────────────────────────
    status: {
      type: String,
      enum: ['PENDING', 'HR_APPROVED', 'HR_REJECTED', 'ADMIN_APPROVED', 'ADMIN_REJECTED', 'CANCELLED'],
      default: 'PENDING',
    },

    // ── HR review ─────────────────────────────────────────
    hrReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hrReviewedAt: { type: Date },
    hrNotes: { type: String },

    // ── Admin review (override) ────────────────────────────
    adminReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adminReviewedAt: { type: Date },
    adminNotes: { type: String },

    // ── Supporting docs ────────────────────────────────────
    attachmentUrl: { type: String },

    // ── Leave balance check ────────────────────────────────
    leaveBalanceAtRequest: { type: Number }, // snapshot of balance when requested
  },
  { timestamps: true }
);

leaveSchema.index({ employee: 1, status: 1 });
leaveSchema.index({ fromDate: 1, toDate: 1 });
leaveSchema.index({ status: 1 });

// Compute totalDays before save
leaveSchema.pre('save', function (next) {
  if (this.fromDate && this.toDate) {
    const diff = (this.toDate - this.fromDate) / (1000 * 60 * 60 * 24);
    this.totalDays = Math.floor(diff) + 1;
  }
  next();
});

leaveSchema.statics.LEAVE_LIMITS = LEAVE_LIMITS;

module.exports = mongoose.model('Leave', leaveSchema);
