const mongoose = require('mongoose');
const ClientType = require('../domains/products/clientType.model');

const seedClientTypes = async () => {
  try {
    const count = await ClientType.countDocuments();
    if (count === 0) {
      console.log('🌱 Seeding default Client Types / Cost Categories...');
      const defaults = [
        { name: 'Retail', key: 'retail', multiplier: 1.0 },
        { name: 'Renewal', key: 'renewal', multiplier: 0.95 },
        { name: 'Corporate', key: 'corporate', multiplier: 0.90 },
        { name: 'Corporate Renewal', key: 'corporateRenewal', multiplier: 0.88 },
        { name: 'Agent', key: 'agent', multiplier: 0.85 },
        { name: 'Agent Renewal', key: 'agentRenewal', multiplier: 0.83 }
      ];
      await ClientType.insertMany(defaults);
      console.log('✅ Seeded default Client Types successfully.');
    }
  } catch (err) {
    console.error('❌ Failed to seed default Client Types:', err.message);
  }
};

const connectDB = async () => {
  const URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gms_crm';
  
  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  let retries = 5;
  
  while (retries > 0) {
    try {
      const conn = await mongoose.connect(URI, options);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      
      // Proactively drop obsolete unique index quotationNumber_1 on quotations collection if it exists
      try {
        const db = conn.connection.db;
        const collection = db.collection('quotations');
        const indexes = await collection.indexes();
        const hasObsoleteIndex = indexes.some(idx => idx.name === 'quotationNumber_1');
        if (hasObsoleteIndex) {
          console.log('⚠️ Found obsolete index "quotationNumber_1" on quotations. Dropping it...');
          await collection.dropIndex('quotationNumber_1');
          console.log('✅ Successfully dropped obsolete index "quotationNumber_1"');
        }
      } catch (err) {
        // Safe to ignore if collection doesn't exist or is empty
      }

      // Seed default client types
      await seedClientTypes();

      return;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('❌ MongoDB connection FAILED after 5 attempts.');
        console.error('Error Details:', error.message);
        console.error('');
        console.error('════════════════════════════════════════');
        console.error('  If you are using MongoDB Atlas (Cloud), check:');
        console.error('  1. Your IP address is whitelisted in Network Access.');
        console.error('  2. Your username and password are correct.');
        console.error('  If you are using Local MongoDB, ensure the service is running.');
        console.error('════════════════════════════════════════');
        console.error('');
        process.exit(1);
      }
      console.log(`⏳ MongoDB not ready, retrying... (${retries} attempts left)`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
};

module.exports = connectDB;
