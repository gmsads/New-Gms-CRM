const companionService = require('../services/companion.service');

/**
 * CompanionController
 * Dedicated additive controller for Android Companion APK device registration and recording uploads.
 */
class CompanionController {
  /**
   * Register Android Device
   */
  async registerDevice(req, res) {
    try {
      const { deviceId, deviceName, appVersion, osVersion, pushToken } = req.body;
      const userId = req.user?._id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required to register device.' });
      }

      const { device, token } = await companionService.registerDevice({
        userId,
        deviceId,
        deviceName,
        appVersion,
        osVersion,
        pushToken
      });

      return res.status(200).json({ success: true, data: { device, companionToken: token } });
    } catch (err) {
      console.error('[CompanionController] Register Error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Process Multipart Audio Upload from Android Companion
   */
  async uploadRecording(req, res) {
    try {
      const file = req.file;
      const { callId, calleePhone, durationSeconds, callStartTime, callEndTime, checksum } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ success: false, message: 'Authentication required for companion upload.' });
      }

      const call = await companionService.processOfflineUpload({
        file,
        callId,
        calleePhone,
        durationSeconds,
        callStartTime,
        callEndTime,
        user,
        checksum
      });

      return res.status(200).json({ success: true, message: 'Recording uploaded and synced.', data: call });
    } catch (err) {
      console.error('[CompanionController] Upload Error:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

module.exports = new CompanionController();
