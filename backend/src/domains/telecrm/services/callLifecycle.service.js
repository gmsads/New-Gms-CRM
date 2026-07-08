const LeadCall = require('../models/leadCall.model');
const Lead = require('../models/lead.model');
const LeadActivity = require('../models/leadActivity.model');

/**
 * CallLifecycleService
 * Event-driven lifecycle manager for telecrm calls.
 * Updates stage timestamps and appends immutable lead timeline events.
 */
class CallLifecycleService {
  async transitionStage({ callId, newStage, timestamp = new Date(), metadata = {}, performedBy = null, performedByName = 'System' }) {
    const call = await LeadCall.findById(callId);
    if (!call) throw new Error('Call record not found for lifecycle transition');

    call.callLifecycleStage = newStage;
    
    // Map timestamps
    const stageKeyMap = {
      'Initiated': 'initiatedAt',
      'Ringing': 'ringingAt',
      'Connected': 'connectedAt',
      'Busy': 'busyAt',
      'No Answer': 'noAnswerAt',
      'Failed': 'failedAt',
      'Cancelled': 'cancelledAt',
      'Missed': 'missedAt',
      'Completed': 'completedAt'
    };

    const tsKey = stageKeyMap[newStage];
    if (tsKey && !call.stageTimestamps[tsKey]) {
      call.stageTimestamps[tsKey] = timestamp;
    }

    if (newStage === 'Initiated' && !call.callStartTime) call.callStartTime = timestamp;
    if (newStage === 'Connected' && !call.callConnectTime) {
      call.callConnectTime = timestamp;
      call.connectedTime = timestamp;
    }
    if (['Completed', 'Busy', 'No Answer', 'Failed', 'Cancelled', 'Missed'].includes(newStage)) {
      call.callEndTime = timestamp;
      call.endTime = timestamp;
      if (call.callConnectTime) {
        const talkSecs = Math.max(0, Math.floor((timestamp.getTime() - call.callConnectTime.getTime()) / 1000));
        call.talkDuration = metadata.talkDuration || talkSecs;
        call.durationSeconds = call.talkDuration;
      }
      if (call.callStartTime && call.callEndTime) {
        call.totalDuration = Math.max(0, Math.floor((call.callEndTime.getTime() - call.callStartTime.getTime()) / 1000));
      }
    }

    if (metadata.recordingUrl) call.recordingUrl = metadata.recordingUrl;
    if (metadata.durationSeconds) {
      call.durationSeconds = Number(metadata.durationSeconds);
      call.talkDuration = Number(metadata.durationSeconds);
    }

    await call.save();

    // Create immutable lead activity
    const activityMap = {
      'Initiated': { type: 'CALL_INITIATED', title: 'Call Initiated', desc: `Telephony call initiated to ${call.calleePhone}` },
      'Ringing': { type: 'CALL_RINGING', title: 'Call Ringing', desc: `Customer phone is ringing` },
      'Connected': { type: 'CALL_CONNECTED', title: 'Call Connected', desc: `Customer answered call` },
      'Completed': { type: 'CALL_COMPLETED', title: 'Call Completed', desc: `Call ended. Talk duration: ${call.talkDuration || 0}s` },
      'Busy': { type: 'CALL_BUSY', title: 'Call Busy', desc: `Customer line busy` },
      'No Answer': { type: 'CALL_NO_ANSWER', title: 'Call No Answer', desc: `Customer did not answer` }
    };

    const actInfo = activityMap[newStage] || { type: `CALL_${newStage.toUpperCase()}`, title: `Call ${newStage}`, desc: `Call status marked as ${newStage}` };

    await LeadActivity.create({
      leadId: call.leadId,
      performedBy: performedBy || call.callerId,
      performedByName: performedByName || call.callerName || 'Executive',
      activityType: actInfo.type,
      description: actInfo.desc,
      metadata: { callId: call._id, status: newStage, ...metadata }
    });

    // Also push to lead timeline array for instant UI drawer display
    await Lead.findByIdAndUpdate(call.leadId, {
      $push: {
        timeline: {
          type: actInfo.type,
          title: actInfo.title,
          description: actInfo.desc,
          performedBy: performedBy || call.callerId,
          performedByName: performedByName || call.callerName || 'Executive',
          timestamp
        }
      }
    });

    return call;
  }
}

module.exports = new CallLifecycleService();
