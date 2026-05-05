const mongoose = require('mongoose');

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
