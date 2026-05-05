const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ── Document classification ────────────────────────────
    documentType: {
      type: String,
      enum: [
        'AADHAAR',
        'PAN',
        'PASSPORT',
        'EDUCATION_CERTIFICATE',
        'EXPERIENCE_LETTER',
        'OFFER_LETTER',
        'SALARY_SLIP',
        'APPOINTMENT_LETTER',
        'RELIEVING_LETTER',
        'BANK_DETAILS',
        'OTHER',
      ],
      required: true,
    },
    documentLabel: { type: String }, // e.g. "B.Tech Degree - 2019"

    // ── File storage ───────────────────────────────────────
    fileName: { type: String, required: true },
    filePath: { type: String, required: true }, // server path (NOT public URL)
    fileSize: { type: Number },                 // bytes
    mimeType: { type: String },

    // ── Secure access ──────────────────────────────────────
    // filePath is NEVER sent to client directly.
    // Controller generates a signed/time-limited token for download.
    isPublic: { type: Boolean, default: false },

    // ── Upload metadata ────────────────────────────────────
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // ── Verification ───────────────────────────────────────
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    verificationNotes: { type: String },

    // ── Soft delete ────────────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

documentSchema.index({ employee: 1, documentType: 1 });
documentSchema.index({ verificationStatus: 1 });
documentSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Document', documentSchema);
