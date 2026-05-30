const mongoose = require('mongoose');

const exitProcessSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    resignationDate: { type: Date, required: true },
    proposedLastDay: { type: Date },
    reason: { type: String },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'MANAGER_REVIEWED',
        'HR_APPROVED',
        'EXIT_INTERVIEW_COMPLETED',
        'SETTLED',
        'WITHDRAWN'
      ],
      default: 'SUBMITTED',
    },
    managerNotes: { type: String },
    exitInterviewNotes: { type: String },
    fullAndFinalStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED'],
      default: 'PENDING',
    },
    clearedBy: [{ department: String, cleared: Boolean, notes: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExitProcess', exitProcessSchema);
