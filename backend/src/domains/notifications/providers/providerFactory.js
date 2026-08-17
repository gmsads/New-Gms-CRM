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
   * @param {string} [providerName] - e.g. 'META_CLOUD_API'
   * @returns {import('./notificationProvider.interface')}
   */
  getProvider(channel, providerName) {
    const normalized = (channel || 'WHATSAPP').toUpperCase();
    
    // Note: Phase 5A additive integration preserves provider propagation without redesigning.
    // Future phases (5B) will utilize the providerName for explicit multi-provider resolution.
    const provider = this.providers[normalized];
    if (!provider) {
      throw new Error(`Notification provider for channel "${normalized}" is not registered.`);
    }
    return provider;
  }
}

module.exports = new ProviderFactory();
