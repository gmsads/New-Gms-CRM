const LeadCall = require('../models/leadCall.model');
const Lead = require('../models/lead.model');
const LeadActivity = require('../models/leadActivity.model');
const { broadcastToUser } = require('../../../socket/socketManager');

/**
 * CallLifecycleService
 * Event-driven lifecycle manager for telecrm calls.
 * Updates stage timestamps, emits realtime socket events, and appends immutable lead timeline events.
 */
class CallLifecycleService {
  async transitionStage({ callId, newStage, timestamp = new Date(), metadata = {}, performedBy = null, performedByName = 'System' }) {
    const call = await LeadCall.findById(callId);
    if (!call) throw new Error('Call record not found for lifecycle transition');

    call.callLifecycleStage = newStage;
    
    // Map timestamps
    const stageKeyMap = {
      'Idle': 'idleAt',
      'Initiated': 'initiatedAt',
      'Ringing': 'ringingAt',
      'Connected': 'connectedAt',
      'Busy': 'busyAt',
      'No Answer': 'noAnswerAt',
      'Failed': 'failedAt',
      'Cancelled': 'cancelledAt',
      'Missed': 'missedAt',
      'Completed': 'completedAt',
      'Disposition Pending': 'dispositionPendingAt',
      'Disposed': 'disposedAt'
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
    if (['Completed', 'Busy', 'No Answer', 'Failed', 'Cancelled', 'Missed', 'Disposition Pending'].includes(newStage)) {
      if (!call.callEndTime) {
        call.callEndTime = timestamp;
        call.endTime = timestamp;
      }
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

    // Emit Realtime Socket Events to Executive's Room
    try {
      const socketPayload = {
        callId: call._id,
        leadId: call.leadId,
        callerId: call.callerId,
        calleePhone: call.calleePhone,
        status: newStage,
        talkDuration: call.talkDuration || 0,
        recordingUrl: call.recordingUrl || null,
        timestamp
      };
      if (newStage === 'Initiated' || newStage === 'Ringing') {
        broadcastToUser(call.callerId, 'CALL_STARTED', socketPayload);
      } else if (newStage === 'Connected') {
        broadcastToUser(call.callerId, 'CALL_CONNECTED', socketPayload);
      } else if (['Completed', 'Busy', 'No Answer', 'Disposition Pending'].includes(newStage)) {
        broadcastToUser(call.callerId, 'CALL_COMPLETED', socketPayload);
      } else if (['Failed', 'Cancelled', 'Missed'].includes(newStage)) {
        broadcastToUser(call.callerId, 'CALL_FAILED', socketPayload);
        broadcastToUser(call.callerId, 'CALL_COMPLETED', socketPayload); // also trigger disposition modal
      }
    } catch (sockErr) {
      console.warn('[CallLifecycle] Socket broadcast warning:', sockErr.message);
    }

    // Create immutable lead activity
    const activityMap = {
      'Idle': { type: 'CALL_IDLE', title: 'Call Idle', desc: `Call session initialized in Idle state` },
      'Initiated': { type: 'CALL_INITIATED', title: 'Call Initiated', desc: `Telephony call initiated to ${call.calleePhone}` },
      'Ringing': { type: 'CALL_RINGING', title: 'Call Ringing', desc: `Customer phone is ringing` },
      'Connected': { type: 'CALL_CONNECTED', title: 'Call Connected', desc: `Customer answered call` },
      'Completed': { type: 'CALL_COMPLETED', title: 'Call Completed', desc: `Call ended. Talk duration: ${call.talkDuration || 0}s` },
      'Busy': { type: 'CALL_BUSY', title: 'Call Busy', desc: `Customer line busy` },
      'No Answer': { type: 'CALL_NO_ANSWER', title: 'Call No Answer', desc: `Customer did not answer` },
      'Disposition Pending': { type: 'CALL_DISPOSITION_PENDING', title: 'Disposition Pending', desc: `Call ended, awaiting executive disposition remark` },
      'Disposed': { type: 'CALL_DISPOSED', title: 'Call Disposed', desc: `Call disposition submitted by executive` }
    };

    const actInfo = activityMap[newStage] || { type: `CALL_${newStage.toUpperCase()}`, title: `Call ${newStage}`, desc: `Call status marked as ${newStage}` };

    if (call.leadId) {
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
    }

    return call;
  }
}

module.exports = new CallLifecycleService();
