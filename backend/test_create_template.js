require('dotenv').config();
const whatsAppProvider = require('./src/domains/notifications/providers/whatsApp.provider');

async function test() {
  try {
    const payload = {
      name: `gms_test_template_${Date.now()}`,
      language: 'en_US',
      category: 'MARKETING',
      components: [
        { type: 'HEADER', format: 'TEXT', text: 'Test Header' },
        { type: 'BODY', text: 'Hello {{1}}, this is a test template for GMS CRM.' },
        { type: 'FOOTER', text: 'GMS CRM Testing' },
        { type: 'BUTTONS', buttons: [{ type: 'QUICK_REPLY', text: 'Confirm' }] }
      ]
    };
    
    console.log('Testing createTemplate with payload:', JSON.stringify(payload, null, 2));
    
    const result = await whatsAppProvider.createTemplate(payload);
    console.log('Result from Meta API:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error creating template:', error.message);
  }
}

test();

test();
