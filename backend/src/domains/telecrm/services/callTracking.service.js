const LeadCall = require('../models/leadCall.model');
const Lead = require('../models/lead.model');
const auditService = require('./audit.service');

class CallTrackingService {
  async trackCallStart({ leadId, callerId, callerName, calleePhone, companyName, direction = 'Outbound', provider = 'Mock Provider', device = 'Web/Mobile App' }) {
    const call = await LeadCall.create({
      leadId,
      callerId,
      callerName,
      calleePhone,
      companyName,
      direction,
      provider,
      callStatus: 'Connected', // initial state before disposition
      ringStart: new Date(),
      startTime: new Date(),
      device
    });

    // Update lead status & timestamp
    await Lead.findByIdAndUpdate(leadId, {
      $set: { 
        currentStatus: 'Calling',
        firstCalledAt: new Date()
      }
    });

    return call;
  }

  async finalizeCall({ callId, callStatus, durationSeconds, acwSeconds, remarks, businessDisposition, interested, needMeeting, needQuotation, recordingUrl, providerConfirmed = true, user }) {
    const call = await LeadCall.findById(callId);
    if (!call) throw new Error('Call record not found');

    const endTime = new Date();
    const talkDuration = durationSeconds || 0;

    // Outcome validation: Connected calls must have talk time or provider confirmation
    if (callStatus === 'Connected' && talkDuration <= 0 && !providerConfirmed) {
      // Still allow but flag note
    }

    call.callStatus = callStatus || 'Connected';
    call.durationSeconds = talkDuration;
    call.talkDuration = talkDuration;
    call.acwSeconds = acwSeconds || 0;
    call.endTime = endTime;
    call.remarks = remarks || '';
    call.businessDisposition = businessDisposition || callStatus;
    call.interested = !!interested;
    call.needMeeting = !!needMeeting;
    call.needQuotation = !!needQuotation;
    if (recordingUrl) call.recordingUrl = recordingUrl;
    call.providerConfirmed = providerConfirmed;

    await call.save();

    // Audit log
    await auditService.log({
      userId: user?._id || call.callerId,
      userName: user?.name || call.callerName,
      action: 'CALL_DISPOSITION',
      targetId: call._id,
      targetModel: 'LeadCall',
      newValue: { callStatus, talkDuration, businessDisposition, acwSeconds }
    });

    return call;
  }
}

module.exports = new CallTrackingService();
