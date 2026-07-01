/**
 * notificationProvider.interface.js
 * Contract that all notification providers (WhatsApp, Email, SMS, Push, Slack) must implement.
 */

class NotificationProvider {
  /**
   * Validates if the payload and configuration are sufficient to send a message.
   * @param {Object} payload 
   * @param {Object} config 
   * @returns {{ valid: boolean, error?: string }}
   */
  validate(payload, config) {
    throw new Error('Method validate() must be implemented by concrete provider class.');
  }

  /**
   * Formats generic variables and message structures into provider-specific format.
   * @param {Object} data 
   * @returns {Object}
   */
  formatPayload(data) {
    throw new Error('Method formatPayload() must be implemented by concrete provider class.');
  }

  /**
   * Sends the notification over network to the provider.
   * @param {Object} payload 
   * @param {Object} config - Tenant or environment specific API keys/URLs
   * @returns {Promise<{ success: boolean, messageId?: string, rawResponse?: Object, error?: string, statusCode?: number }>}
   */
  async send(payload, config) {
    throw new Error('Method send() must be implemented by concrete provider class.');
  }

  /**
   * Parses incoming provider response or webhook response into normalized format.
   * @param {Object} rawResponse 
   * @returns {Object}
   */
  parseResponse(rawResponse) {
    throw new Error('Method parseResponse() must be implemented by concrete provider class.');
  }
}

module.exports = NotificationProvider;
