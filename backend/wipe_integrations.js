const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gms')
  .then(async () => {
    console.log('Connected to DB, dropping IntegrationRegistry...');
    const IntegrationRegistry = require('./src/domains/integration/models/integrationRegistry.model');
    await IntegrationRegistry.deleteMany({});
    console.log('Successfully wiped IntegrationRegistry.');
  })
  .catch(err => {
    console.error('DB Connection error:', err);
  })
  .finally(() => {
    mongoose.disconnect();
  });
