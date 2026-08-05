/**
 * Enterprise Queue Factory
 * Abstracts BullMQ and Fallback implementations.
 */
const providerType = process.env.QUEUE_PROVIDER || 'fallback';
const cacheProviderType = process.env.CACHE_PROVIDER || 'memory';

let Queue = null;
let Worker = null;
let useBullMQ = false;
let connection = null;

// Only attempt BullMQ if we explicitly want it AND Redis cache is available
if (providerType === 'bullmq' && cacheProviderType === 'redis') {
  try {
    const bullmq = require('bullmq');
    Queue = bullmq.Queue;
    Worker = bullmq.Worker;
    // We require the redis.service directly here because the factory needs the raw connection.
    // However, the rest of the application must NOT do this.
    const redisService = require('../cache/redis.service');
    connection = redisService.redisClient;
    useBullMQ = true;
  } catch (err) {
    console.warn('[QueueFactory] BullMQ or ioredis not installed. Falling back.');
  }
}

// Fallback logic implemented natively in communicationQueue for now,
// but we provide the flags so consumers know what to do.

module.exports = {
  getQueue: (name, defaultOptions = {}) => {
    if (useBullMQ && Queue && connection) {
      return new Queue(name, { connection, ...defaultOptions });
    }
    return null; // Signals consumer to use their mock/fallback
  },
  createWorker: (name, processor, options = {}) => {
    if (useBullMQ && Worker && connection) {
      return new Worker(name, processor, { connection, ...options });
    }
    return null;
  },
  _getProviderInfo: () => useBullMQ ? 'bullmq' : 'fallback',
  _isBullMQ: () => useBullMQ,
  // DO NOT EXPOSE connection OR BullMQ classes directly
};
