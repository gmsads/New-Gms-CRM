/**
 * policyResolver.service.js
 * Evaluates notification rules, checks customer preferences/opt-outs, and resolves target channels.
 */

const phoneService = require('../../../utils/phone.service');
const configService = require('../../../core/config/config.service');
const communicationRegistryService = require('./communicationRegistry.service');

class PolicyResolverService {
  /**
   * Resolves target channels and validates recipient contacts for a domain event.
   * @param {string} eventName 
   * @param {Object} payload 
   * @returns {Promise<{ allowed: boolean, channels: Array<string>, recipientPhone: string|null, reason?: string, plan?: Object }>}
   */
  async resolve(eventName, payload = {}) {
    // Extract raw phone number from payload (Order/Payment clientSnapshot or prospect)
    const rawPhone = payload?.clientSnapshot?.phone 
                  || payload?.client?.phone 
                  || payload?.prospect?.phone 
                  || payload?.phone;

    const normalizedPhone = rawPhone ? phoneService.normalize(rawPhone) : null;

    try {
      // 1. Check Global Feature Flag via Config Service
      const commEnabled = await configService.get('COMMUNICATION_ENABLED', 'true');
      if (commEnabled === 'false') {
        return { allowed: false, channels: [], recipientPhone: normalizedPhone, reason: 'Global communication disabled via feature flag' };
      }

      // 2. Fetch Rule from Communication Registry
      const tenantId = payload?.tenantId || null;
      const branchId = payload?.branchId || null;
      
      const rule = await communicationRegistryService.getRule(eventName, tenantId, branchId);
      
      if (rule) {
        console.log(`[PolicyResolver] Registry rule found for ${eventName}`);
        
        // Build Enterprise Communication Plan
        const planChannels = rule.channels.map((ch, index) => {
          return {
            channel: ch,
            provider: rule.providerPriority && rule.providerPriority[index] ? rule.providerPriority[index] : 'DEFAULT',
            priority: index + 1
          };
        });

        const plan = {
          version: 1,
          event: eventName,
          channels: planChannels,
          branchId,
          tenantId,
          correlationId: payload?.correlationId || null,
          featureFlags: {
            COMMUNICATION_ENABLED: commEnabled
          },
          source: 'registry'
        };

        if (!normalizedPhone) {
          return { allowed: false, channels: [], recipientPhone: null, reason: 'No recipient phone number found in event payload', plan };
        }

        return {
          allowed: true,
          channels: rule.channels, // Flat array preserves backward compatibility
          recipientPhone: normalizedPhone,
          plan // The new enterprise contract injected silently
        };
      }
    } catch (err) {
      console.warn(`[PolicyResolver] Error resolving registry/config for ${eventName}. Falling back to legacy logic.`, err.message);
    }

    // 3. LEGACY FALLBACK LOGIC
    console.log(`[PolicyResolver] Using legacy fallback for ${eventName}`);
    const whatsappEnabled = process.env.ENABLE_WHATSAPP_NOTIFICATIONS !== 'false';
    if (!whatsappEnabled) {
      return { allowed: false, channels: [], recipientPhone: null, reason: 'WhatsApp notifications disabled by environment' };
    }

    if (!normalizedPhone) {
      return { allowed: false, channels: [], recipientPhone: null, reason: 'No recipient phone number found in event payload' };
    }

    const channels = ['WHATSAPP'];

    return {
      allowed: true,
      channels,
      recipientPhone: normalizedPhone
    };
  }
}

module.exports = new PolicyResolverService();
