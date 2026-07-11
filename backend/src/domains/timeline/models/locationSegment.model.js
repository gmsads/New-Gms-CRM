const mongoose = require('mongoose');

const locationSegmentSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkdaySession', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date },
    segmentType: { 
      type: String, 
      enum: ['TRAVEL', 'STOP', 'IDLE'], 
      required: true,
      index: true 
    },
    category: { 
      type: String, 
      enum: ['Office Time', 'Travel Time', 'Client Time', 'Idle Time', 'Break Time', 'Unknown Time'],
      default: 'Unknown Time',
      index: true 
    },
    durationMinutes: { type: Number, default: 0 },
    startCoords: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String }
    },
    endCoords: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String }
    },
    distanceKm: { type: Number, default: 0 },
    path: [
      {
        latitude: { type: Number },
        longitude: { type: Number },
        timestamp: { type: Date },
        speed: { type: Number },
        heading: { type: Number },
        accuracy: { type: Number }
      }
    ],
    dateString: { type: String, index: true }
  },
  { timestamps: true }
);

locationSegmentSchema.index({ sessionId: 1, startTime: 1 });
locationSegmentSchema.index({ userId: 1, dateString: 1 });

module.exports = mongoose.model('LocationSegment', locationSegmentSchema, 'employee_location_segments');
