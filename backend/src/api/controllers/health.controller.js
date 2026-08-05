const mongoose = require('mongoose');
const cacheFactory = require('../../services/cache/cacheFactory');
const queueFactory = require('../../services/queues/queueFactory');

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
      cache: {
        provider: cacheFactory._getProviderInfo(),
        status: cacheFactory._getStatus()
      },
      queue: {
        provider: queueFactory._getProviderInfo(),
        status: 'enabled'
      }
    }
  };

  // Check MongoDB
  const readyState = mongoose.connection.readyState;
  if (readyState === 1) health.services.mongodb.status = 'connected';
  else if (readyState === 2) health.services.mongodb.status = 'connecting';
  else health.services.mongodb.status = 'disconnected';

  // Determine overall status
  if (health.services.mongodb.status !== 'connected' || health.services.cache.status !== 'connected') {
    health.status = 'degraded';
    // Still return 200 so load balancer doesn't kill it immediately unless completely dead
  }

  res.status(200).json(health);
};
