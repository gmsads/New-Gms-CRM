const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  skill: { type: String }, // e.g., 'Electrician', 'Installer'
  availability: {
    type: String,
    enum: ['Available', 'On Job', 'Unavailable', 'Leave'],
    default: 'Available'
  },
  attendance: {
    type: String,
    enum: ['Present', 'Absent', 'Half Day'],
    default: 'Present'
  },
  assignedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Labour', labourSchema);
