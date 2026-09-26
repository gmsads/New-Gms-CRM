const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gms');

const IntegrationRegistry = require('./src/domains/integration/models/integrationRegistry.model');
const { getIntegrations } = require('./src/api/controllers/integration.controller');

async function test() {
  try {
    const req = { user: { tenantId: null } };
    const res = {
      json: (data) => console.log('Response:', JSON.stringify(data, null, 2)),
      status: (code) => { console.log('Status code:', code); return { json: (data) => console.log('Error:', data) }; }
    };
    await getIntegrations(req, res);
  } catch (e) {
    console.error('Fatal error:', e);
  } finally {
    mongoose.disconnect();
  }
}
test();
