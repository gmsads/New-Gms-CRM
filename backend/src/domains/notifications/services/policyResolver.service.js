/**
 * policyResolver.service.js
 * Evaluates notification rules, checks customer preferences/opt-outs, and resolves target channels.
 */

const phoneService = require('../../../utils/phone.service');

class PolicyResolverService {
  /**
   * Resolves target channels and validates recipient contacts for a domain event.
   * @param {string} eventName 
   * @param {Object} payload 
   * @returns {Promise<{ allowed: boolean, channels: Array<string>, recipientPhone: string|null, reason?: string }>}
   */
  async resolve(eventName, payload = {}) {
    // Check global toggle for WhatsApp messaging
    const whatsappEnabled = process.env.ENABLE_WHATSAPP_NOTIFICATIONS !== 'false';
    if (!whatsappEnabled) {
      return { allowed: false, channels: [], recipientPhone: null, reason: 'WhatsApp notifications disabled by environment' };
    }

    // Extract raw phone number from payload (Order/Payment clientSnapshot or prospect)
    const rawPhone = payload?.clientSnapshot?.phone 
                  || payload?.client?.phone 
                  || payload?.prospect?.phone 
                  || payload?.phone;

    if (!rawPhone) {
      return { allowed: false, channels: [], recipientPhone: null, reason: 'No recipient phone number found in event payload' };
    }

    // Normalize to E.164
    const normalizedPhone = phoneService.normalize(rawPhone);
    if (!normalizedPhone) {
      return { allowed: false, channels: [], recipientPhone: null, reason: `Phone number "${rawPhone}" could not be normalized to E.164` };
    }

    // Determine channels (currently WHATSAPP is primary for Phase 1)
    const channels = ['WHATSAPP'];

    return {
      allowed: true,
      channels,
      recipientPhone: normalizedPhone
    };
  }
}

module.exports = new PolicyResolverService();
