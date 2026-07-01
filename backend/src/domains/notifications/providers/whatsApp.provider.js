/**
 * whatsApp.provider.js
 * Implements Meta Cloud API for WhatsApp Business Messaging.
 * Multi-tenant ready: Accepts provider credentials per tenant or falls back to environment settings.
 */

const NotificationProvider = require('./notificationProvider.interface');

class WhatsAppProvider extends NotificationProvider {
  constructor() {
    super();
    this.apiVersion = process.env.META_API_VERSION || 'v19.0';
    this.baseUrl = 'https://graph.facebook.com';
  }

  validate(payload, config = {}) {
    const token = config.accessToken || process.env.META_ACCESS_TOKEN;
    const phoneId = config.phoneNumberId || process.env.META_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      // In development sandbox/test mode without credentials, allow simulated success
      if (process.env.NODE_ENV !== 'production' && !token) {
        return { valid: true, simulated: true };
      }
      return { valid: false, error: 'Missing Meta Access Token or Phone Number ID.' };
    }

    if (!payload || !payload.to) {
      return { valid: false, error: 'Recipient phone number (to) is required.' };
    }

    return { valid: true };
  }

  formatPayload(data) {
    const { recipientPhone, templateName, language = 'en_US', variables = [] } = data;

    // Convert E.164 (+919876543210) to Meta accepted digits (919876543210)
    const toDigits = String(recipientPhone).replace(/[^\d]/g, '');

    const components = [];
    if (variables && variables.length > 0) {
      components.push({
        type: 'body',
        parameters: variables.map(val => ({
          type: 'text',
          text: String(val !== null && val !== undefined ? val : '-')
        }))
      });
    }

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toDigits,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: language
        },
        components
      }
    };
  }

  async send(payload, config = {}) {
    const validation = this.validate(payload, config);
    if (!validation.valid) {
      return { success: false, error: validation.error, statusCode: 400 };
    }

    const token = config.accessToken || process.env.META_ACCESS_TOKEN;
    const phoneId = config.phoneNumberId || process.env.META_PHONE_NUMBER_ID;

    // Simulated sandbox response when real credentials aren't set in development
    if (validation.simulated || !token) {
      const simulatedMsgId = `wamid.SIMULATED_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      console.log(`[WhatsAppProvider Sandbox] Simulated sending template "${payload?.template?.name}" to ${payload?.to}`);
      return {
        success: true,
        messageId: simulatedMsgId,
        statusCode: 200,
        rawResponse: { simulated: true, messages: [{ id: simulatedMsgId }] }
      };
    }

    const url = `${this.baseUrl}/${this.apiVersion}/${phoneId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          statusCode: response.status,
          error: responseData?.error?.message || 'Meta Cloud API request failed',
          rawResponse: responseData
        };
      }

      const messageId = responseData?.messages?.[0]?.id || `wamid.${Date.now()}`;
      return {
        success: true,
        statusCode: 200,
        messageId,
        rawResponse: responseData
      };
    } catch (err) {
      return {
        success: false,
        statusCode: 500,
        error: err.message || 'Network exception calling Meta Cloud API'
      };
    }
  }

  parseResponse(rawResponse) {
    if (!rawResponse) return { success: false };
    const messageId = rawResponse?.messages?.[0]?.id;
    return {
      success: !!messageId || !!rawResponse.simulated,
      messageId
    };
  }
}

module.exports = new WhatsAppProvider();
