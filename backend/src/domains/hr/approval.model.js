const mongoose = require('mongoose');

/**
 * Approval Model
 * Tracks every HR-initiated action that requires Admin/MD_CEO sign-off.
 * Immutable once APPROVED — can only be REVISED (sent back) or REJECTED.
 */
const approvalSchema = new mongoose.Schema(
  {
    // ── What kind of approval ──────────────────────────────
    type: {
      type: String,
      enum: [
        'EMPLOYEE_CREATION',
        'ROLE_CHANGE',
        'STATUS_CHANGE',
        'SALARY_CHANGE',
        'REACTIVATION',
        'DOCUMENT_VERIFICATION',
        'ATTENDANCE_EDIT_OLD', // editing attendance >2 days ago
      ],
      required: true,
    },

    // ── Who is affected ────────────────────────────────────
    targetEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Who initiated ──────────────────────────────────────
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Who reviewed ──────────────────────────────────────
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: { type: Date },

    // ── Approval state ────────────────────────────────────
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVISED'],
      default: 'PENDING',
    },

    // ── Change data ───────────────────────────────────────
    previousValue: { type: mongoose.Schema.Types.Mixed }, // snapshot before change
    newValue: { type: mongoose.Schema.Types.Mixed },      // what HR wants to change TO

    // ── Notes ─────────────────────────────────────────────
    hrNotes: { type: String },           // HR's reason for the action
    adminNotes: { type: String },        // Admin's reason for approve/reject/revise
    revisionInstructions: { type: String }, // What HR needs to fix before resubmitting

    // ── Re-submission tracking ────────────────────────────
    submissionCount: { type: Number, default: 1 }, // increments on each resubmit
    parentApproval: {                              // links to original if this is a resubmit
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Approval',
    },

    // ── Urgency ───────────────────────────────────────────
    priority: {
      type: String,
      enum: ['NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
  },
  { timestamps: true }
);

approvalSchema.index({ status: 1, type: 1 });
approvalSchema.index({ initiatedBy: 1 });
approvalSchema.index({ targetEmployee: 1 });
approvalSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Approval', approvalSchema);
