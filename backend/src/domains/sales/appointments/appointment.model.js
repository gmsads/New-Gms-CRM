const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  prospect: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Sales Exec
  
  // Auto-populated for denormalization/quick access
  businessName: { type: String },
  contactPerson: { type: String },
  phone: { type: String },

  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g., "10:30 AM"
  venue: { type: String, required: true },

  status: { 
    type: String, 
    enum: ['Pending Assignment', 'Scheduled', 'Completed', 'Canceled'], 
    default: 'Pending Assignment' 
  },
  
  // Assigned by Manager
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date },

  // Updated by Assigned Person
  remark: { type: String },
  remarkUpdatedAt: { type: Date },

}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
