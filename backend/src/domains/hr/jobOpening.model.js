const mongoose = require('mongoose');

const jobOpeningSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String, required: true },
    vacancies: { type: Number, required: true, default: 1 },
    experience: { type: String, required: true }, // e.g. "2-4 Years"
    salaryRange: { type: String }, // e.g. "50,000 - 80,000"
    location: { type: String, default: 'On-site' },
    status: {
      type: String,
      enum: ['OPEN', 'ON_HOLD', 'CLOSED'],
      default: 'OPEN',
    },
    assignedRecruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobOpening', jobOpeningSchema);
