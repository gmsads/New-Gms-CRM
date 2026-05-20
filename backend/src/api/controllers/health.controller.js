const mongoose = require('mongoose');
const { connection } = require('../../services/queues/queueManager');

exports.checkHealth = async (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date(),
    memoryUsage: process.memoryUsage(),
    services: {
      mongodb: {
        status: 'disconnected'
      },
      redis: {
        status: 'disconnected'
      }
    }
  };

  // Check MongoDB
  const readyState = mongoose.connection.readyState;
  if (readyState === 1) health.services.mongodb.status = 'connected';
  else if (readyState === 2) health.services.mongodb.status = 'connecting';
  else health.services.mongodb.status = 'disconnected';

  // Check Redis
  if (connection && connection.status === 'ready') {
    health.services.redis.status = 'connected';
  } else if (connection) {
    health.services.redis.status = connection.status;
  }

  // Determine overall status
  if (health.services.mongodb.status !== 'connected' || health.services.redis.status !== 'connected') {
    health.status = 'degraded';
    // Still return 200 so load balancer doesn't kill it immediately unless completely dead
  }

  res.status(200).json(health);
};
