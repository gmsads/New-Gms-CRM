const mongoose = require('mongoose');

const appointmentRemarkSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  outcomeType: { 
    type: String, 
    enum: [
      'Interested', 'Need Follow-up', 'Quotation Requested', 
      'Sale Confirmed', 'Budget Issue', 'Competitor Chosen', 'Not Interested'
    ],
    required: true
  },
  
  notes: { type: String, required: true },
  nextActionDate: { type: Date },

  gpsLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number },
    timestamp: { type: Date }
  },
  
  photos: [{
    fileUrl: { type: String, required: true },
    fileName: { type: String },
    uploadTime: { type: Date, default: Date.now }
  }],

}, { timestamps: true });

module.exports = mongoose.models.AppointmentRemark || mongoose.model('AppointmentRemark', appointmentRemarkSchema);
