const jwt = require('jsonwebtoken');
const CompanionDevice = require('../models/companionDevice.model');
const LeadCall = require('../models/leadCall.model');
const recordingStorage = require('./recordingStorage.service');
const callLifecycle = require('./callLifecycle.service');

/**
 * CompanionService
 * Manages Android Companion APK authentication, offline call synchronization, and recording processing.
 */
class CompanionService {
  async registerDevice({ userId, deviceId, deviceName, appVersion, osVersion, pushToken }) {
    if (!deviceId) throw new Error('Device ID is required');

    let device = await CompanionDevice.findOne({ deviceId });
    if (device) {
      device.userId = userId;
      device.deviceName = deviceName || device.deviceName;
      device.appVersion = appVersion || device.appVersion;
      device.pushToken = pushToken || device.pushToken;
      device.isActive = true;
      device.lastSyncAt = new Date();
      await device.save();
    } else {
      device = await CompanionDevice.create({
        userId,
        deviceId,
        deviceName,
        appVersion,
        osVersion,
        pushToken
      });
    }

    const token = jwt.sign(
      { id: userId, deviceId, type: 'COMPANION_APP' },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '30d' }
    );

    return { device, token };
  }

  async processOfflineUpload({ file, callId, calleePhone, durationSeconds, callStartTime, callEndTime, user, checksum }) {
    if (!file) throw new Error('Recording audio file is required');

    let call = null;
    if (callId) {
      call = await LeadCall.findById(callId);
    }

    // If callId missing (offline mode initiated outside active UI session), find recent matching call
    if (!call && calleePhone) {
      const cleanPhone = calleePhone.replace(/\D/g, '').slice(-10);
      call = await LeadCall.findOne({
        callerId: user._id,
        calleePhone: { $regex: cleanPhone }
      }).sort({ createdAt: -1 });
    }

    if (!call) {
      throw new Error('Associated LeadCall record not found for this mobile recording');
    }

    // Save via storage abstraction
    const stored = await recordingStorage.saveRecording({
      fileBuffer: file.buffer,
      originalFilename: file.originalname,
      callId: call._id
    });

    if (checksum && stored.checksum && checksum !== stored.checksum) {
      console.warn(`[CompanionService] Checksum mismatch! Expected ${checksum}, got ${stored.checksum}`);
    }

    call.recordingUrl = stored.recordingUrl;
    call.durationSeconds = Number(durationSeconds || 0);
    call.talkDuration = Number(durationSeconds || 0);
    call.uploadTime = new Date();
    call.uploadStatus = 'SUCCESS';
    call.recordingSize = stored.recordingSize;
    call.storageProvider = stored.storageProvider;
    call.checksum = stored.checksum;
    call.provider = 'Android Companion';
    if (callStartTime) call.callStartTime = new Date(callStartTime);
    if (callEndTime) call.callEndTime = new Date(callEndTime);

    await call.save();

    // Trigger lifecycle completion event
    await callLifecycle.transitionStage({
      callId: call._id,
      newStage: 'Completed',
      timestamp: new Date(),
      metadata: {
        recordingUrl: stored.recordingUrl,
        durationSeconds: call.durationSeconds,
        talkDuration: call.talkDuration
      },
      performedBy: user._id,
      performedByName: user.name || 'Executive (Mobile)'
    });

    return call;
  }
}

module.exports = new CompanionService();
