const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  prospect: { type: mongoose.Schema.Types.ObjectId, ref: 'Prospect', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Sales Exec
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Field/Sales Exec
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Supervising Manager
  
  // Auto-populated for denormalization/quick access
  businessName: { type: String },
  contactPerson: { type: String },
  phone: { type: String },

  date: { type: Date, required: true },
  time: { type: String, required: true }, // e.g., "10:30 AM"
  meetingType: { 
    type: String, 
    enum: ['Office Meeting', 'Site Visit', 'Online Meeting', 'Client Visit'], 
    default: 'Office Meeting' 
  },
  venue: { type: String, required: true },
  priority: { 
    type: String, 
    enum: ['High', 'Medium', 'Low'], 
    default: 'Medium' 
  },

  status: { 
    type: String, 
    enum: [
      'PENDING', 'SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS', 
      'FOLLOWUP_REQUIRED', 'CLIENT_NOT_AVAILABLE', 'CANCELLED', 
      'SALE_CONFIRMED', 'LOST'
    ], 
    default: 'PENDING' 
  },
  
  remark: { type: String },
  executiveRemark: { type: String },
  assigneeRemark: { type: String },
  nextFollowUpDate: { type: Date },

  assignedAt: { type: Date },

  // Escalation System
  isOverdue: { type: Boolean, default: false },
  escalationLevel: { type: Number, default: 0 }, // 0: None, 1: Manager, 2: Admin
  lastEscalatedAt: { type: Date },

}, { timestamps: true, optimisticConcurrency: true });

const softDeletePlugin = require('../../../utils/softDelete.plugin');
appointmentSchema.plugin(softDeletePlugin);

module.exports = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
