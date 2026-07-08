const { connection } = require('../../services/queues/queueManager');
const logger = require('../../utils/logger');

// Fallback in-memory store in case Redis goes down
const memoryStore = new Map();

/**
 * Idempotency Middleware
 * Prevents duplicate POST/PUT/PATCH requests from processing multiple times
 * Requires the client to send an 'Idempotency-Key' header.
 */
module.exports = async (req, res, next) => {
  // Only apply to state-changing methods
  if (['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'];

  // If no key is provided, log warning but allow request (graceful degradation)
  if (!idempotencyKey) {
    logger.debug(`[Idempotency] Missing idempotency-key on ${req.method} ${req.originalUrl}`);
    return next();
  }

  const cacheKey = `idempotency:${req.user?._id || 'anon'}:${idempotencyKey}`;

  try {
    // 1. Try Redis
    if (connection && connection.status === 'ready') {
      const exists = await connection.get(cacheKey);
      if (exists) {
        logger.warn(`[Idempotency] Blocked duplicate request with key: ${idempotencyKey}`);
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_REQUEST',
          message: 'This request has already been processed.'
        });
      }
      
      // Store the key with a 24h expiration
      await connection.setex(cacheKey, 24 * 3600, 'processing');
      return next();
    }
  } catch (err) {
    logger.error(`[Idempotency] Redis Error: ${err.message}`);
  }

  // 2. Fallback to Memory Store if Redis is down
  if (memoryStore.has(cacheKey)) {
    logger.warn(`[Idempotency] Blocked duplicate request (Memory) with key: ${idempotencyKey}`);
    return res.status(409).json({
      success: false,
      code: 'DUPLICATE_REQUEST',
      message: 'This request has already been processed.'
    });
  }

  memoryStore.set(cacheKey, 'processing');
  
  // Cleanup memory store to prevent memory leak
  setTimeout(() => memoryStore.delete(cacheKey), 5 * 60 * 1000); // keep for 5 mins in memory

  next();
};
