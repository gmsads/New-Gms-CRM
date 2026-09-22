const IntegrationRegistry = require('../../domains/integration/models/integrationRegistry.model');

// Wipe all integrations to reset the state for demonstration
setTimeout(async () => {
  try {
    await IntegrationRegistry.deleteMany({});
    console.log('[INTEGRATIONS] Successfully wiped all integration records for a clean slate.');
  } catch (e) {
    console.log('[INTEGRATIONS] Wipe failed:', e.message);
  }
}, 2000);

const getTenantId = (req) => {
  return req.user?.tenantId || null;
};

const PROVIDERS_CONFIG = [
  { provider: 'FACEBOOK_LEAD_ADS', title: 'Meta Lead Ads', desc: 'Capture and manage leads from your Facebook Instant forms', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'FACEBOOK_COMMENTS', title: 'Meta Comments', desc: 'Automate responses to comments on your Facebook/Instagram posts.', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'CLICK_TO_WHATSAPP_ADS', title: 'Meta CTWA Ads', desc: 'Track Meta ad clicks, send conversion events, and manage CTWA campaigns.', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'WHATSAPP', title: 'WhatsApp API', desc: 'Connect Meta WhatsApp Cloud API for official bulk marketing and automated replies', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'INDIAMART_LEADS', title: 'IndiaMART Leads', desc: 'Real-time lead delivery via webhook Push API', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'JUSTDIAL', title: 'Justdial', desc: 'Capture leads directly from Justdial via webhooks', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'SULEKHA', title: 'Sulekha', desc: 'Integrate Sulekha lead alerts into your sales pipeline', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'TRADEINDIA', title: 'TradeIndia', desc: 'Sync B2B leads and inquiries from TradeIndia', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'RAZORPAY', title: 'Razorpay', desc: 'Accept payments in your chatbot flows with payment links', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'GOOGLE_SHEETS', title: 'Google Sheets', desc: 'Exchange data between chatbot and Google Sheets', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'GOOGLE_ADS', title: 'Google Ads', desc: 'Sync leads and offline conversions with Google Ads', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'GOOGLE_CALENDAR', title: 'Google Calendar', desc: 'Connect Google Calendar for booking automation and availability', initialStatus: 'NOT_CONNECTED', initialActive: false },
  { provider: 'GOOGLE_BUSINESS', title: 'Google Business Profile', desc: 'Manage reviews and messages from your Google Business Profile', initialStatus: 'NOT_CONNECTED', initialActive: false },
];

exports.getIntegrations = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    let integrations = await IntegrationRegistry.find({ tenantId });

    // Seed if none exist
    if (integrations.length === 0) {
      const seedData = PROVIDERS_CONFIG.map(p => ({
        tenantId,
        provider: p.provider,
        status: p.initialStatus,
        isActive: p.initialActive
      }));
      integrations = await IntegrationRegistry.insertMany(seedData);
    }

    const formattedData = PROVIDERS_CONFIG.map(config => {
      const dbEntry = integrations.find(i => i.provider === config.provider);
      return {
        ...config,
        status: dbEntry ? dbEntry.status : config.initialStatus,
        isActive: dbEntry ? dbEntry.isActive : config.initialActive
      };
    });

    res.json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.toggleIntegration = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { provider, isActive } = req.body;
    
    let integration = await IntegrationRegistry.findOne({ tenantId, provider });
    if (!integration) {
      integration = new IntegrationRegistry({ tenantId, provider });
    }
    integration.isActive = isActive;
    await integration.save();

    res.json({ success: true, data: integration });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.connectIntegration = async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { provider } = req.body;
    
    let integration = await IntegrationRegistry.findOne({ tenantId, provider });
    if (!integration) {
      integration = new IntegrationRegistry({ tenantId, provider });
    }
    
    // Simulate connection flow
    integration.status = 'CONNECTED';
    integration.isActive = true;
    await integration.save();

    res.json({ success: true, data: integration });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
