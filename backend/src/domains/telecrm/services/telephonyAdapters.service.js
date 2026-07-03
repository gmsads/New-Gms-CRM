/**
 * TelephonyAdaptersService
 * Normalizes webhook payloads from Exotel, Knowlarity, Airtel IQ, Ozonetel, MyOperator, and Twilio.
 */
class TelephonyAdaptersService {
  normalizeWebhook(provider, payload = {}) {
    const p = (provider || '').toUpperCase();

    switch (p) {
      case 'EXOTEL':
        return {
          providerCallId: payload.CallSid || payload.Sid,
          status: this.mapStatus(payload.Status || payload.EventType),
          durationSeconds: parseInt(payload.RecordingDuration || payload.Duration || 0, 10),
          recordingUrl: payload.RecordingUrl,
          calleePhone: payload.To || payload.CustomerNumber,
          callerPhone: payload.From
        };
      case 'KNOWLARITY':
        return {
          providerCallId: payload.uuid || payload.call_id,
          status: this.mapStatus(payload.call_status || payload.disposition),
          durationSeconds: parseInt(payload.duration || payload.talktime || 0, 10),
          recordingUrl: payload.resource_url || payload.recording_url,
          calleePhone: payload.destination || payload.customer_number
        };
      case 'TWILIO':
        return {
          providerCallId: payload.CallSid,
          status: this.mapStatus(payload.CallStatus),
          durationSeconds: parseInt(payload.RecordingDuration || payload.CallDuration || 0, 10),
          recordingUrl: payload.RecordingUrl ? `${payload.RecordingUrl}.mp3` : null,
          calleePhone: payload.To
        };
      case 'AIRTEL IQ':
      case 'AIRTELIQ':
        return {
          providerCallId: payload.correlationId || payload.callId,
          status: this.mapStatus(payload.callState || payload.status),
          durationSeconds: parseInt(payload.talkDuration || payload.duration || 0, 10),
          recordingUrl: payload.recordingUrl,
          calleePhone: payload.customerPhone || payload.callee
        };
      case 'OZONETEL':
      case 'MYOPERATOR':
      default:
        // Generic / Mock fallback normalization
        return {
          providerCallId: payload.CallSid || payload.call_id || payload.uuid || payload.providerCallId,
          status: this.mapStatus(payload.Status || payload.status || payload.call_status || 'Completed'),
          durationSeconds: parseInt(payload.Duration || payload.duration || payload.talkDuration || 30, 10),
          recordingUrl: payload.RecordingUrl || payload.recording_url || payload.audioUrl,
          calleePhone: payload.To || payload.calleePhone || payload.phone
        };
    }
  }

  mapStatus(rawStatus = '') {
    const s = rawStatus.toString().toLowerCase();
    if (s.includes('connect') || s === 'completed' || s === 'answered' || s === 'in-progress') return 'Completed';
    if (s.includes('busy')) return 'Busy';
    if (s.includes('no-answer') || s.includes('noanswer') || s.includes('unanswered')) return 'No Answer';
    if (s.includes('fail') || s.includes('error')) return 'Failed';
    if (s.includes('cancel')) return 'Cancelled';
    if (s.includes('miss')) return 'Missed';
    return 'Completed';
  }
}

module.exports = new TelephonyAdaptersService();
