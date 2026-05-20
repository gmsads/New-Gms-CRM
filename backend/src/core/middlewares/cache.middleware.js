const redisService = require('../../services/redis.service');

const cacheMiddleware = (expiry = 3600) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') return next();

    const key = `cache:${req.originalUrl}:${req.user?._id || 'guest'}`;
    
    try {
      const cachedData = await redisService.get(key);
      if (cachedData) {
        return res.json({ ...cachedData, _fromCache: true });
      }

      // Intercept res.json to cache the response
      const originalJson = res.json;
      res.json = function (body) {
        if (res.statusCode === 200 && body.success) {
          redisService.set(key, body, expiry);
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (err) {
      console.error('Cache Middleware Error:', err);
      next();
    }
  };
};

module.exports = cacheMiddleware;
