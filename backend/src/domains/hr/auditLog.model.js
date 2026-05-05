const mongoose = require('mongoose');

/**
 * AuditLog Model — IMMUTABLE, WRITE-ONLY
 * Every sensitive action in the system is recorded here.
 * No update or delete is allowed. Enforced at controller level.
 */
const auditLogSchema = new mongoose.Schema(
  {
    // ── What happened ──────────────────────────────────────
    action: {
      type: String,
      enum: [
        // Employee lifecycle
        'EMPLOYEE_CREATED',
        'EMPLOYEE_APPROVED',
        'EMPLOYEE_REJECTED',
        'EMPLOYEE_REVISED',
        'EMPLOYEE_RESUBMITTED',
        'EMPLOYEE_ACTIVATED',
        'EMPLOYEE_DEACTIVATED',
        'EMPLOYEE_SUSPENDED',
        'EMPLOYEE_REACTIVATED',
        // Role & data changes
        'ROLE_CHANGED',
        'STATUS_CHANGED',
        'SALARY_CHANGED',
        'PROFILE_UPDATED',
        // Attendance
        'ATTENDANCE_MARKED',
        'ATTENDANCE_EDITED',
        'ATTENDANCE_EDIT_REQUESTED', // >2 days — needs Admin approval
        // Leave
        'LEAVE_SUBMITTED',
        'LEAVE_HR_APPROVED',
        'LEAVE_HR_REJECTED',
        'LEAVE_ADMIN_APPROVED',
        'LEAVE_ADMIN_REJECTED',
        // Documents
        'DOCUMENT_UPLOADED',
        'DOCUMENT_VERIFIED',
        'DOCUMENT_REJECTED',
        'DOCUMENT_DELETED',
        // HR Policy
        'PROBATION_REVIEWED',
        'EXIT_INITIATED',
        'EXIT_COMPLETED',
        // Auth
        'LOGIN',
        'LOGIN_FAILED',
        'PASSWORD_CHANGED',
      ],
      required: true,
    },

    // ── Who did it ─────────────────────────────────────────
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByRole: { type: String }, // snapshot of role at time of action

    // ── Who was affected ───────────────────────────────────
    targetEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // ── What changed ──────────────────────────────────────
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    changedFields: [{ type: String }], // list of field names changed

    // ── Context ────────────────────────────────────────────
    ipAddress: { type: String },
    userAgent: { type: String },
    notes: { type: String },

    // ── Reference to related approval ─────────────────────
    relatedApproval: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Approval',
    },
  },
  {
    timestamps: true,
    // Prevent accidental updates at mongoose level
    versionKey: false,
  }
);

// Indexes for fast Admin querying
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ targetEmployee: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
