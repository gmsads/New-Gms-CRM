const mongoose = require('mongoose');

const stopHistorySchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkdaySession', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    arrivalTime: { type: Date, required: true, index: true },
    departureTime: { type: Date },
    durationMinutes: { type: Number, default: 0 },
    coords: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    address: { type: String },
    businessName: { type: String },
    building: { type: String },
    street: { type: String },
    area: { type: String },
    city: { type: String },
    category: { 
      type: String, 
      enum: ['Client Office', 'Office', 'Restaurant', 'Petrol Pump', 'Bank', 'Mall', 'Unknown'],
      default: 'Unknown',
      index: true
    },
    isVerifiedClientSite: { type: Boolean, default: false },
    matchedVisitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
    dateString: { type: String, index: true }
  },
  { timestamps: true }
);

stopHistorySchema.index({ userId: 1, arrivalTime: -1 });
stopHistorySchema.index({ userId: 1, dateString: 1 });
stopHistorySchema.index({ category: 1 });

module.exports = mongoose.model('StopHistory', stopHistorySchema, 'employee_stop_history');
