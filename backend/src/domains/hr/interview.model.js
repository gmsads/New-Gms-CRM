const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    interviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g. "14:30"
    meetingLink: { type: String },
    remarks: { type: String },
    status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'SELECTED', 'REJECTED', 'HOLD'],
      default: 'SCHEDULED',
    },
    feedback: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Interview', interviewSchema);
