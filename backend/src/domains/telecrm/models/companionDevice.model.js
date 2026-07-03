const mongoose = require('mongoose');

const companionDeviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deviceId: { type: String, required: true, unique: true },
    deviceName: { type: String, trim: true },
    appVersion: { type: String, default: '1.0.0' },
    osVersion: { type: String, default: 'Android' },
    pushToken: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    lastSyncAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

companionDeviceSchema.index({ userId: 1, isActive: 1 });
companionDeviceSchema.index({ deviceId: 1 });

module.exports = mongoose.models.CompanionDevice || mongoose.model('CompanionDevice', companionDeviceSchema);
