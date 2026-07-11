/**
 * WorkdaySessionEngine (workdaySession.service.js)
 * Manages active workday sessions from Login to Logout.
 * Operates purely as a parallel background service without altering authentication or role logic.
 */

const WorkdaySession = require('../models/workdaySession.model');
const TimelineEvent = require('../models/timelineEvent.model');
const workdaySummaryService = require('./workdaySummary.service');

class WorkdaySessionEngine {
  /**
   * Get currently active session for an employee
   */
  async getActiveSession(userId) {
    if (!userId) return null;
    return await WorkdaySession.findOne({ userId, status: 'ACTIVE' }).sort({ loginTime: -1 });
  }

  /**
   * Called asynchronously when an employee logs in via CRM login API or opens PWA
   */
  async onEmployeeLogin(user, req = {}) {
    if (!user || !user._id) return null;

    // Check if employee role is eligible for timeline tracking (Field Exec, Sales Mgr, Operation Mgr, Branch Head, etc.)
    const eligibleRoles = [
      'FIELD_EXEC', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'OPERATION_MANAGER', 
      'BRANCH_HEAD', 'BRANCH_MANAGER', 'SALES_EXEC'
    ];
    if (user.role && !eligibleRoles.includes(user.role)) {
      return null;
    }

    const userId = user._id;
    const dateString = new Date().toISOString().split('T')[0];

    // Check if an active session already exists today
    let session = await WorkdaySession.findOne({ userId, status: 'ACTIVE', dateString });

    if (!session) {
      session = await WorkdaySession.create({
        userId,
        role: user.role,
        branch: user.branch || null,
        department: user.department || 'Operations',
        loginTime: new Date(),
        status: 'ACTIVE',
        dateString,
        deviceInfo: req.headers ? req.headers['user-agent'] : 'Web/Mobile Client'
      });

      // Create initial LOGIN timeline event
      await TimelineEvent.create({
        sessionId: session._id,
        userId,
        timestamp: session.loginTime,
        eventType: 'LOGIN',
        title: '09:00 Workday Started (Login)',
        description: `Logged in as ${user.name || user.username} (${user.role})`,
        dateString,
        location: {
          category: 'Office'
        }
      });
    }

    return session;
  }

  /**
   * Called when employee logs out or ends shift
   */
  async onEmployeeLogout(userId, finalPing = null) {
    if (!userId) return null;

    const session = await WorkdaySession.findOne({ userId, status: 'ACTIVE' }).sort({ loginTime: -1 });
    if (!session) return null;

    const logoutTime = new Date();
    session.logoutTime = logoutTime;
    session.status = 'COMPLETED';

    if (finalPing) {
      session.lastLocation = {
        latitude: finalPing.latitude,
        longitude: finalPing.longitude,
        address: finalPing.locationName || '',
        timestamp: logoutTime,
        batteryEnd: finalPing.batteryLevel
      };
    }
    await session.save();

    // Log LOGOUT timeline event
    await TimelineEvent.create({
      sessionId: session._id,
      userId,
      timestamp: logoutTime,
      eventType: 'LOGOUT',
      title: `${logoutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Workday Ended (Logout)`,
      description: `Shift completed. Total duration: ${Math.round((logoutTime - session.loginTime) / 60000)} minutes`,
      dateString: session.dateString,
      location: finalPing ? {
        latitude: finalPing.latitude,
        longitude: finalPing.longitude,
        address: finalPing.locationName || '',
        category: 'Office'
      } : { category: 'Office' }
    });

    // Finalize workday summary
    await workdaySummaryService.generateOrUpdateSummary({
      userId,
      dateString: session.dateString,
      sessionId: session._id
    });

    return session;
  }

  /**
   * Auto-close stale sessions (> 16 hours active or past midnight)
   */
  async autoCloseStaleSessions() {
    const sixteenHoursAgo = new Date(Date.now() - 16 * 3600000);
    const staleSessions = await WorkdaySession.find({
      status: 'ACTIVE',
      loginTime: { $lt: sixteenHoursAgo }
    });

    for (const s of staleSessions) {
      s.status = 'AUTO_CLOSED';
      s.logoutTime = new Date(s.loginTime.getTime() + 9 * 3600000); // assume 9 hours shift
      await s.save();
      await workdaySummaryService.generateOrUpdateSummary({
        userId: s.userId,
        dateString: s.dateString,
        sessionId: s._id
      });
    }
  }
}

module.exports = new WorkdaySessionEngine();
