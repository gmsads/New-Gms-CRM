const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    resumeUrl: { type: String }, // link to resume file
    experience: { type: String },
    appliedPosition: { type: mongoose.Schema.Types.ObjectId, ref: 'JobOpening', required: true },
    source: { type: String, default: 'Direct' },
    status: {
      type: String,
      enum: [
        'APPLIED',
        'SCREENING',
        'INTERVIEW_SCHEDULED',
        'INTERVIEW_COMPLETED',
        'SELECTED',
        'REJECTED',
        'OFFER_SENT',
        'JOINED',
      ],
      default: 'APPLIED',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Candidate', candidateSchema);
