/**
 * Enterprise Cache Factory
 * Abstracts cache implementation away from business modules.
 */
const providerType = process.env.CACHE_PROVIDER || 'memory';

let activeCache;

if (providerType === 'redis') {
  const redisService = require('./redis.service');
  
  // Wrap to enforce strict interface (hide redisClient)
  activeCache = {
    getCache: redisService.getCache,
    setCache: redisService.setCache,
    deleteCache: redisService.deleteCache,
    clearCachePattern: redisService.clearCachePattern,
    exists: async (key) => redisService.redisClient ? (await redisService.redisClient.exists(key)) === 1 : false,
    ttl: async (key) => redisService.redisClient ? await redisService.redisClient.ttl(key) : -2,
    _getProviderInfo: () => 'redis',
    _getStatus: () => (redisService.redisClient && redisService.redisClient.status === 'ready' ? 'connected' : 'disconnected')
  };
} else {
  const memoryCache = require('./memoryCache.service');
  activeCache = {
    ...memoryCache,
    _getProviderInfo: () => 'memory',
    _getStatus: () => 'connected' // Memory is always available
  };
}

module.exports = activeCache;
