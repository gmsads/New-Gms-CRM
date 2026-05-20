const mongoose = require('mongoose');

const appointmentTimelineSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User who performed the action
  
  action: { 
    type: String, 
    enum: ['CREATED', 'ASSIGNED', 'STATUS_CHANGED', 'REMARK_ADDED', 'ESCALATED', 'QUOTATION_GENERATED', 'ORDER_CREATED'],
    required: true
  },
  
  previousState: { type: mongoose.Schema.Types.Mixed },
  newState: { type: mongoose.Schema.Types.Mixed },

}, { timestamps: true });

module.exports = mongoose.models.AppointmentTimeline || mongoose.model('AppointmentTimeline', appointmentTimelineSchema);
