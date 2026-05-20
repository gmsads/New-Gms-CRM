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
    targetModel: { type: String }, // e.g. 'Prospect', 'Appointment'
    targetId: { type: mongoose.Schema.Types.ObjectId }, // The ID of the modified record

    // ── What changed ──────────────────────────────────────
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    changedFields: [{ type: String }], // list of field names changed

    // ── Context ────────────────────────────────────────────
    ipAddress: { type: String },
    userAgent: { type: String },
    device: { type: String },
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
auditLogSchema.index({ targetModel: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
