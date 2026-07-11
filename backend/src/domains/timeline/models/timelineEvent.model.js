const mongoose = require('mongoose');

const timelineEventSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkdaySession', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
    eventType: { 
      type: String, 
      enum: [
        'LOGIN', 'LOGOUT', 'START_TRAVEL', 'ARRIVED_STOP', 'DEPARTED_STOP', 
        'STATIONARY', 'BREAK', 'OFFICE_STAY', 'CLIENT_STAY', 'HEARTBEAT'
      ], 
      required: true,
      index: true 
    },
    title: { type: String, required: true }, // e.g., 'Arrived at ABC Enterprises'
    description: { type: String }, // e.g., 'Stayed 1 hour 18 minutes'
    durationMinutes: { type: Number, default: 0 },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      businessName: { type: String },
      building: { type: String },
      street: { type: String },
      area: { type: String },
      city: { type: String },
      category: { 
        type: String, 
        enum: ['Client Office', 'Office', 'Restaurant', 'Petrol Pump', 'Bank', 'Mall', 'Unknown', 'Transit'],
        default: 'Unknown'
      }
    },
    metadata: {
      speed: { type: Number },
      heading: { type: Number },
      accuracy: { type: Number },
      batteryLevel: { type: Number },
      internetStatus: { type: Boolean, default: true },
      isMoving: { type: Boolean, default: false },
      stopId: { type: mongoose.Schema.Types.ObjectId, ref: 'StopHistory' }
    },
    dateString: { type: String, index: true } // YYYY-MM-DD
  },
  { timestamps: true }
);

timelineEventSchema.index({ sessionId: 1, timestamp: 1 });
timelineEventSchema.index({ userId: 1, timestamp: -1 });
timelineEventSchema.index({ userId: 1, dateString: 1 });

module.exports = mongoose.model('TimelineEvent', timelineEventSchema, 'employee_timeline_events');
