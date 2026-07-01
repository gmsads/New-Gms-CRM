const WorkingSession = require('../models/workingSession.model');
const User = require('../../../domains/users/user.model');

class LiveStatusService {
  async getTodaySession(userId, userName) {
    const todayStr = new Date().toISOString().split('T')[0];
    let session = await WorkingSession.findOne({ userId, date: todayStr });
    if (!session) {
      session = await WorkingSession.create({
        userId,
        userName: userName || 'Executive',
        date: todayStr,
        currentStatus: 'Available',
        lastStatusChange: new Date(),
        loginTime: new Date()
      });
    }
    return session;
  }

  async updateStatus(userId, userName, newStatus) {
    const session = await this.getTodaySession(userId, userName);
    const now = new Date();
    const elapsedSecs = Math.max(0, Math.floor((now - new Date(session.lastStatusChange)) / 1000));

    const oldStatus = session.currentStatus || 'Available';
    if (session.durations[oldStatus] !== undefined) {
      session.durations[oldStatus] += elapsedSecs;
    } else {
      session.durations[oldStatus] = elapsedSecs;
    }

    session.activityHistory.push({
      status: oldStatus,
      startedAt: session.lastStatusChange,
      endedAt: now,
      durationSeconds: elapsedSecs
    });

    session.currentStatus = newStatus;
    session.lastStatusChange = now;
    if (newStatus === 'Offline') {
      session.logoutTime = now;
    }

    await session.save();
    return session;
  }

  async getWallboard() {
    const todayStr = new Date().toISOString().split('T')[0];
    const sessions = await WorkingSession.find({ date: todayStr }).lean();

    const counts = {
      Available: 0,
      Calling: 0,
      Break: 0,
      Lunch: 0,
      Meeting: 0,
      AfterCallWork: 0,
      Offline: 0,
      Idle: 0
    };

    sessions.forEach(s => {
      const st = s.currentStatus || 'Offline';
      if (counts[st] !== undefined) counts[st]++;
      else counts.Offline++;
    });

    return { counts, sessions };
  }
}

module.exports = new LiveStatusService();
