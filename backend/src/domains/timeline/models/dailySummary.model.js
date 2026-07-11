const mongoose = require('mongoose');

const dailySummarySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    dateString: { type: String, required: true, index: true }, // YYYY-MM-DD
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkdaySession' },
    loginTime: { type: Date },
    logoutTime: { type: Date },
    totalWorkingMinutes: { type: Number, default: 0 },
    distanceTravelledKm: { type: Number, default: 0 },
    numberOfStops: { type: Number, default: 0 },
    breakdownMinutes: {
      office: { type: Number, default: 0 },
      travel: { type: Number, default: 0 },
      client: { type: Number, default: 0 },
      break: { type: Number, default: 0 },
      idle: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 }
    },
    stopCategoriesCount: {
      clientOffice: { type: Number, default: 0 },
      office: { type: Number, default: 0 },
      restaurant: { type: Number, default: 0 },
      petrolPump: { type: Number, default: 0 },
      bank: { type: Number, default: 0 },
      mall: { type: Number, default: 0 },
      unknown: { type: Number, default: 0 }
    },
    routeBounds: {
      minLat: { type: Number },
      maxLat: { type: Number },
      minLng: { type: Number },
      maxLng: { type: Number }
    },
    isComplete: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Compound unique index so one summary per employee per day
dailySummarySchema.index({ userId: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('DailySummary', dailySummarySchema, 'employee_daily_summary');
