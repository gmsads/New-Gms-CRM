/**
 * AnalyticsService (analytics.service.js)
 * Provides optimized queries for the Admin Workforce Intelligence Dashboard and all 6 enterprise reports.
 */

const WorkdaySession = require('../models/workdaySession.model');
const TimelineEvent = require('../models/timelineEvent.model');
const StopHistory = require('../models/stopHistory.model');
const DailySummary = require('../models/dailySummary.model');
const LocationSegment = require('../models/locationSegment.model');
const User = require('../../../domains/users/user.model'); // adjust path to User
const routeAnalyzer = require('./routeAnalyzer.service');

class AnalyticsService {
  /**
   * Get live status of all eligible on-field / sales employees
   */
  async getLiveWorkforceStatus(filters = {}) {
    const eligibleRoles = [
      'FIELD_EXEC', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'OPERATION_MANAGER',
      'BRANCH_HEAD', 'BRANCH_MANAGER', 'SALES_EXEC'
    ];

    const userQuery = { isActive: { $ne: false }, role: { $in: eligibleRoles } };
    if (filters.branch && filters.branch !== 'all') userQuery.branch = filters.branch;
    if (filters.role && filters.role !== 'all') userQuery.role = filters.role;

    const users = await User.find(userQuery)
      .select('name email role phone department profilePicture branch status')
      .lean();

    const dateString = new Date().toISOString().split('T')[0];
    const activeSessions = await WorkdaySession.find({ dateString }).lean();
    const sessionMap = new Map(activeSessions.map(s => [s.userId.toString(), s]));

    const liveData = users.map(u => {
      const uIdStr = u._id.toString();
      const session = sessionMap.get(uIdStr);

      let status = 'Not Logged In';
      let lastSeen = null;
      let currentAddress = 'Unknown';
      let batteryLevel = null;
      let speedKmH = 0;
      let distanceKm = 0;
      let stopsCount = 0;
      let workingMinutes = 0;

      if (session) {
        lastSeen = session.lastLocation?.timestamp || session.loginTime;
        currentAddress = session.lastLocation?.address || 'On Shift';
        batteryLevel = session.lastLocation?.batteryEnd || session.batteryAtStart;
        speedKmH = session.lastLocation?.speed || 0;
        distanceKm = session.metrics?.distanceTravelledKm || 0;
        stopsCount = session.metrics?.numberOfStops || 0;
        workingMinutes = session.metrics?.totalWorkingMinutes || 0;

        if (session.status === 'COMPLETED') {
          status = 'Shift Ended (Logged Out)';
        } else if (session.status === 'ACTIVE') {
          const diffSec = lastSeen ? (Date.now() - new Date(lastSeen).getTime()) / 1000 : 9999;
          if (diffSec > 900) {
            status = 'Idle / Signal Lost (>15m)';
          } else if (speedKmH > 3) {
            status = 'Moving - En Route';
          } else {
            status = 'Stationary - Active';
          }
        }
      }

      return {
        user: u,
        session: session ? { _id: session._id, loginTime: session.loginTime, logoutTime: session.logoutTime } : null,
        status,
        lastSeen,
        currentAddress,
        batteryLevel,
        speedKmH,
        distanceKm,
        stopsCount,
        workingMinutes
      };
    });

    return liveData;
  }

  /**
   * Get daily comprehensive timeline & shift breakdown for an employee
   */
  async getEmployeeDailyTimeline({ userId, dateString }) {
    if (!userId || !dateString) return null;

    const session = await WorkdaySession.findOne({ userId, dateString }).lean();
    const summary = await DailySummary.findOne({ userId, dateString }).lean();
    const events = await TimelineEvent.find({ userId, dateString }).sort({ timestamp: 1 }).lean();
    const stops = await StopHistory.find({ userId, dateString }).sort({ arrivalTime: 1 }).lean();
    const playback = await routeAnalyzer.getRoutePlaybackData({ userId, dateString, sessionId: session?._id });

    return {
      session,
      summary,
      events,
      stops,
      playback
    };
  }

  /**
   * Generate 6 Enterprise Reports data
   */
  async generateEnterpriseReport({ reportType, startDate, endDate, userId, role }) {
    const query = {};
    if (startDate && endDate) {
      query.dateString = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.dateString = startDate;
    } else {
      query.dateString = new Date().toISOString().split('T')[0];
    }
    if (userId && userId !== 'all') query.userId = userId;

    if (reportType === 'Employee Timeline Report') {
      const events = await TimelineEvent.find(query)
        .populate('userId', 'name email role department')
        .sort({ timestamp: -1 })
        .limit(1000)
        .lean();
      return events;
    } else if (reportType === 'Daily Movement Report') {
      const segments = await LocationSegment.find({ ...query, segmentType: 'TRAVEL' })
        .populate('userId', 'name email role department')
        .sort({ startTime: -1 })
        .limit(1000)
        .lean();
      return segments;
    } else if (reportType === 'Stop History Report') {
      const stops = await StopHistory.find(query)
        .populate('userId', 'name email role department')
        .sort({ arrivalTime: -1 })
        .limit(1000)
        .lean();
      return stops;
    } else if (reportType === 'Location Duration Report') {
      const summaries = await DailySummary.find(query)
        .populate('userId', 'name email role department')
        .sort({ dateString: -1 })
        .limit(500)
        .lean();
      return summaries.map(s => ({
        employee: s.userId,
        date: s.dateString,
        clientMinutes: s.breakdownMinutes?.client || 0,
        officeMinutes: s.breakdownMinutes?.office || 0,
        travelMinutes: s.breakdownMinutes?.travel || 0,
        breakMinutes: s.breakdownMinutes?.break || 0,
        idleMinutes: s.breakdownMinutes?.idle || 0,
        totalWorkingMinutes: s.totalWorkingMinutes || 0
      }));
    } else if (reportType === 'Workday Summary Report') {
      const summaries = await DailySummary.find(query)
        .populate('userId', 'name email role department')
        .sort({ dateString: -1 })
        .limit(500)
        .lean();
      return summaries;
    } else if (reportType === 'Route Replay Report') {
      const sessions = await WorkdaySession.find(query)
        .populate('userId', 'name email role department')
        .sort({ loginTime: -1 })
        .limit(200)
        .lean();
      return sessions;
    }

    return [];
  }
}

module.exports = new AnalyticsService();
