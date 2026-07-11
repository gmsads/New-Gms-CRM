/**
 * Timeline Controller (timeline.controller.js)
 * Additive API endpoints for Workforce Intelligence, continuous shift tracking, and enterprise reports.
 */

const workdaySessionService = require('../../domains/timeline/services/workdaySession.service');
const timelineEngine = require('../../domains/timeline/services/timelineEngine.service');
const analyticsService = require('../../domains/timeline/services/analytics.service');
const LocationPing = require('../../domains/field/visits/locationPing.model');

/**
 * POST /api/timeline/workday/login
 * Explicitly or automatically trigger workday start (`09:00 Login`)
 */
exports.startWorkdaySession = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const session = await workdaySessionService.onEmployeeLogin(user, req);
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/timeline/workday/logout
 * Finalize workday session (`17:48 Logout`), compute total hours, distance, and stops
 */
exports.endWorkdaySession = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { latitude, longitude, batteryLevel, locationName } = req.body || {};
    let finalPing = null;
    if (latitude && longitude) {
      finalPing = { latitude: Number(latitude), longitude: Number(longitude), batteryLevel, locationName };
    }

    const session = await workdaySessionService.onEmployeeLogout(user._id, finalPing);
    res.status(200).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/timeline/workday/ping
 * Adaptive background GPS ping containing speed, heading, battery, and internet status
 */
exports.recordWorkdayPing = async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const { latitude, longitude, accuracy, speed, heading, batteryLevel, internetStatus, locationName } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
    }

    // Record into existing LocationPing collection so all CRM tracking features also receive it!
    const pingDoc = await LocationPing.create({
      userId: user._id,
      role: user.role,
      latitude: Number(latitude),
      longitude: Number(longitude),
      accuracy: accuracy ? Number(accuracy) : 0,
      timestamp: new Date(),
      status: speed > 3 ? 'Moving (Adaptive Tracking)' : 'Stationary (Adaptive Tracking)',
      locationName: locationName || `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`,
      batteryLevel: batteryLevel ? Number(batteryLevel) : null,
      deviceInfo: req.headers['user-agent'] || 'PWA Engine'
    });

    // Also explicitly pass to timelineEngine in case hook is not triggered synchronously
    timelineEngine.processLocationPing(pingDoc).catch(() => {});

    res.status(201).json({ success: true, data: pingDoc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/timeline/live-status
 * Get live status of all eligible on-field / sales workforce employees
 */
exports.getLiveStatus = async (req, res) => {
  try {
    const { branch, role } = req.query;
    const liveData = await analyticsService.getLiveWorkforceStatus({ branch, role });
    res.status(200).json({ success: true, data: liveData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/timeline/employee/:userId/daily
 * Get comprehensive daily timeline, stop history, and shift breakdown for an employee
 */
exports.getEmployeeDailyTimeline = async (req, res) => {
  try {
    const { userId } = req.params;
    const { dateString } = req.query;
    const targetDate = dateString || new Date().toISOString().split('T')[0];

    const timelineData = await analyticsService.getEmployeeDailyTimeline({
      userId,
      dateString: targetDate
    });

    res.status(200).json({ success: true, data: timelineData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/timeline/playback/:userId
 * Get route coordinates, speed profile, and timestamped segments for interactive replay
 */
exports.getRoutePlayback = async (req, res) => {
  try {
    const { userId } = req.params;
    const { dateString } = req.query;
    const targetDate = dateString || new Date().toISOString().split('T')[0];

    const timelineData = await analyticsService.getEmployeeDailyTimeline({
      userId,
      dateString: targetDate
    });

    res.status(200).json({ success: true, data: timelineData ? timelineData.playback : null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/timeline/reports/:reportType
 * Generate data for any of the 6 requested enterprise workforce reports
 */
exports.generateReports = async (req, res) => {
  try {
    const { reportType } = req.params;
    const { startDate, endDate, userId, role } = req.query;

    const reportData = await analyticsService.generateEnterpriseReport({
      reportType,
      startDate,
      endDate,
      userId,
      role
    });

    res.status(200).json({ success: true, data: reportData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
