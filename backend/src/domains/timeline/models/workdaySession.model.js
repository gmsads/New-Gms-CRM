const mongoose = require('mongoose');

const workdaySessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String, index: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    department: { type: String },
    loginTime: { type: Date, required: true, default: Date.now, index: true },
    logoutTime: { type: Date },
    status: { 
      type: String, 
      enum: ['ACTIVE', 'COMPLETED', 'AUTO_CLOSED'], 
      default: 'ACTIVE',
      index: true 
    },
    metrics: {
      totalWorkingMinutes: { type: Number, default: 0 },
      distanceTravelledKm: { type: Number, default: 0 },
      numberOfStops: { type: Number, default: 0 },
      officeMinutes: { type: Number, default: 0 },
      travelMinutes: { type: Number, default: 0 },
      clientMinutes: { type: Number, default: 0 },
      breakMinutes: { type: Number, default: 0 },
      idleMinutes: { type: Number, default: 0 },
      unknownMinutes: { type: Number, default: 0 }
    },
    lastLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      timestamp: { type: Date },
      speed: { type: Number, default: 0 },
      heading: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }
    },
    deviceInfo: { type: String },
    batteryAtStart: { type: Number },
    batteryAtEnd: { type: Number },
    dateString: { type: String, index: true } // YYYY-MM-DD for fast querying
  },
  { timestamps: true }
);

// Compound index for fast lookup of active sessions by user
workdaySessionSchema.index({ userId: 1, status: 1 });
workdaySessionSchema.index({ userId: 1, dateString: 1 });

module.exports = mongoose.model('WorkdaySession', workdaySessionSchema, 'employee_workday_sessions');
