/**
 * TelephonyService Abstraction Layer
 * Supports future providers: Exotel, Knowlarity, MyOperator, Ozonetel, Airtel IQ.
 * Currently defaults to Mock Provider for instant verification.
 */
class TelephonyService {
  constructor() {
    this.provider = process.env.TELEPHONY_PROVIDER || 'Mock Provider';
  }

  /**
   * initiateCall
   * Initiates a Click-To-Call session between Executive and Customer.
   */
  async initiateCall({ callerPhone, calleePhone, leadId, callerId }) {
    if (this.provider === 'Mock Provider') {
      const mockCallId = `MOCK-CALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      return {
        success: true,
        provider: 'Mock Provider',
        providerCallId: mockCallId,
        status: 'Initiated',
        message: `[Mock] Calling ${calleePhone} from ${callerPhone}...`
      };
    }

    // Abstraction hooks for future actual provider APIs
    switch (this.provider) {
      case 'Exotel':
        // Future Exotel API call
        throw new Error('Exotel provider credentials not configured.');
      case 'Knowlarity':
        throw new Error('Knowlarity provider credentials not configured.');
      case 'MyOperator':
      case 'Ozonetel':
      case 'Airtel IQ':
        throw new Error(`${this.provider} provider integration pending.`);
      default:
        throw new Error(`Unsupported telephony provider: ${this.provider}`);
    }
  }

  /**
   * processWebhook
   * Receives disposition/recording updates from Telephony provider.
   */
  async processWebhook(payload) {
    // Normalizes webhook data across providers
    return {
      providerCallId: payload.CallSid || payload.call_id || payload.providerCallId,
      status: payload.Status || payload.call_status || 'Connected',
      durationSeconds: parseInt(payload.Duration || payload.duration || 45, 10),
      recordingUrl: payload.RecordingUrl || payload.recording_url || 'https://sample-videos.com/audio/mp3/crowd-cheering.mp3',
      endTime: new Date()
    };
  }
}

module.exports = new TelephonyService();
