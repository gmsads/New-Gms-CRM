const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(__dirname, '..', envFile);

if (fs.existsSync(envPath)) {
  console.log(`[Config] Loading environment from ${envFile}`);
  dotenv.config({ path: envPath });
} else {
  // Fallback to default .env for backwards compatibility
  dotenv.config();
}

const mongoose = require('mongoose');
mongoose.plugin(require('./core/plugins/softDelete.plugin'));
const app       = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Connect to MongoDB first
  await connectDB();

  // 2. Then start HTTP server
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api`);
  });

  // 3. Initialize Socket.IO
  const socketManager = require('./socket/socketManager');
  const io = socketManager.initSocket(server);
  
  // Inject socket instance into NotificationWorkflowService
  const notificationWorkflow = require('./services/workflows/notificationWorkflow.service');
  notificationWorkflow.setSocketIo(io);

  // Handle port already in use
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use!`);
      console.error(`   Kill the old process or change PORT in .env.development`);
      process.exit(1);
    } else {
      console.error('Server error:', err.message);
      process.exit(1);
    }
  });
};

startServer();
