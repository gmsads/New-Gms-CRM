/**
 * providerFactory.js
 * Resolves concrete notification providers dynamically by channel.
 */

const whatsAppProvider = require('./whatsApp.provider');

class ProviderFactory {
  constructor() {
    this.providers = {
      WHATSAPP: whatsAppProvider,
      // Future channels (EMAIL, SMS, PUSH, SLACK, TEAMS) plug in here seamlessly
    };
  }

  /**
   * Returns provider instance for specified channel.
   * @param {string} channel - e.g. 'WHATSAPP'
   * @returns {import('./notificationProvider.interface')}
   */
  getProvider(channel) {
    const normalized = (channel || 'WHATSAPP').toUpperCase();
    const provider = this.providers[normalized];
    if (!provider) {
      throw new Error(`Notification provider for channel "${normalized}" is not registered.`);
    }
    return provider;
  }
}

module.exports = new ProviderFactory();
