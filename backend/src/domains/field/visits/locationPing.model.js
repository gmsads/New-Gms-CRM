const mongoose = require('mongoose');

const locationPingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: { type: String },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number },
    timestamp: { type: Date, default: Date.now, index: true },
    status: { type: String, default: 'Active' }, // e.g. 'At Client Site', 'En Route', 'Checked In', 'Checked Out'
    locationName: { type: String }, // approximate business or address
    visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit' },
    batteryLevel: { type: Number },
    deviceInfo: { type: String }
  },
  { timestamps: true }
);

locationPingSchema.index({ userId: 1, timestamp: -1 });

// Non-blocking async event subscription for Workforce Intelligence Timeline Engine
locationPingSchema.post('save', function (doc) {
  try {
    const timelineEngine = require('../../timeline/services/timelineEngine.service');
    if (timelineEngine && typeof timelineEngine.processLocationPing === 'function') {
      timelineEngine.processLocationPing(doc).catch(() => {});
    }
  } catch (err) {}
});

module.exports = mongoose.model('LocationPing', locationPingSchema);
