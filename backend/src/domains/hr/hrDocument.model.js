const mongoose = require('mongoose');

const hrDocumentSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }, // for offer letters
    documentType: {
      type: String,
      enum: [
        'OFFER_LETTER',
        'APPOINTMENT_LETTER',
        'EXPERIENCE_LETTER',
        'RELIEVING_LETTER',
        'SALARY_CERTIFICATE',
        'PROMOTION_LETTER',
        'TRANSFER_LETTER',
        'WARNING_LETTER',
      ],
      required: true,
    },
    fileUrl: { type: String }, // S3 or local path if saved
    contentData: { type: mongoose.Schema.Types.Mixed }, // JSON payload used to generate it
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentViaEmail: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HRDocument', hrDocumentSchema);
