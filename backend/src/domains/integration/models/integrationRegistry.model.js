const mongoose = require('mongoose');

const integrationRegistrySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false // Optional for now as User schema lacks tenantId
  },
  provider: {
    type: String,
    required: true,
    enum: [
      'FACEBOOK_COMMENTS',
      'INSTAGRAM_COMMENTS',
      'DRIP_CAMPAIGNS',
      'GOOGLE_SHEETS',
      'FACEBOOK_LEAD_ADS',
      'INDIAMART_LEADS',
      'AI_INTEGRATION',
      'SHOPIFY',
      'CALENDLY',
      'GOOGLE_CALENDAR',
      'RAZORPAY',
      'ZOHO_CRM',
      'CLICK_TO_WHATSAPP_ADS',
      'JUSTDIAL',
      'SULEKHA',
      'TRADEINDIA',
      'EXOTEL'
    ]
  },
  status: {
    type: String,
    enum: ['CONNECTED', 'NOT_CONNECTED', 'NEEDS_CONFIGURATION'],
    default: 'NOT_CONNECTED'
  },
  isActive: {
    type: Boolean,
    default: false
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Ensure one entry per provider per tenant
integrationRegistrySchema.index({ tenantId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('IntegrationRegistry', integrationRegistrySchema);
