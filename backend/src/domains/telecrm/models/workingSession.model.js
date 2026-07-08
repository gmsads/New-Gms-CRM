const mongoose = require('mongoose');

const workingSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    
    currentStatus: {
      type: String,
      enum: ['Available', 'Calling', 'Break', 'Lunch', 'Offline', 'Meeting', 'After Call Work', 'Idle'],
      default: 'Available'
    },
    lastStatusChange: { type: Date, default: Date.now },
    
    // Aggregated seconds in each state for today
    durations: {
      Available: { type: Number, default: 0 },
      Calling: { type: Number, default: 0 },
      Break: { type: Number, default: 0 },
      Lunch: { type: Number, default: 0 },
      Meeting: { type: Number, default: 0 },
      AfterCallWork: { type: Number, default: 0 },
      Idle: { type: Number, default: 0 }
    },
    
    loginTime: { type: Date, default: Date.now },
    logoutTime: { type: Date, default: null },
    
    activityHistory: [{
      status: String,
      startedAt: Date,
      endedAt: Date,
      durationSeconds: Number
    }]
  },
  { timestamps: true }
);

workingSessionSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.models.WorkingSession || mongoose.model('WorkingSession', workingSessionSchema);
