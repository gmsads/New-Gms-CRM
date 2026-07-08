/**
 * communicationQueue.js
 * Asynchronous queue manager for the Enterprise Communication Center.
 * Implements BullMQ queues (eventBusQueue, communicationQueue, communicationDLQ) when Redis is available.
 * Includes a resilient asynchronous Fallback Queue for local dev/testing environments where Redis/BullMQ is unavailable.
 */

let Queue, Worker;
let connection = null;
let useBullMQ = false;

try {
  const bullmq = require('bullmq');
  Queue = bullmq.Queue;
  Worker = bullmq.Worker;
  const { redisClient } = require('../../services/cache/redis.service');
  connection = redisClient;
  useBullMQ = true;
} catch (err) {
  console.warn('[CommunicationQueue] BullMQ or Redis unavailable. Using resilient async fallback queue.');
}

const defaultJobOptions = {
  attempts: Number(process.env.QUEUE_RETRY_LIMIT || 3),
  backoff: {
    type: 'exponential',
    delay: Number(process.env.QUEUE_BACKOFF || 5000)
  },
  removeOnComplete: { age: 24 * 3600, count: 500 },
  removeOnFail: { age: 7 * 24 * 3600 }
};

class FallbackQueue {
  constructor(name) {
    this.name = name;
    this.processor = null;
  }

  async add(jobName, data, options = {}) {
    // Process asynchronously without blocking API thread
    setImmediate(async () => {
      if (!this.processor) return;
      const job = { id: `FB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, name: jobName, data, attemptsMade: 0 };
      const maxAttempts = options.attempts || defaultJobOptions.attempts;
      
      const executeWithRetry = async () => {
        try {
          await this.processor(job);
        } catch (err) {
          job.attemptsMade++;
          console.error(`[FallbackQueue:${this.name}] Job ${job.id} failed attempt ${job.attemptsMade}:`, err.message);
          if (job.attemptsMade < maxAttempts) {
            const delay = (options.backoff?.delay || 5000) * Math.pow(2, job.attemptsMade - 1);
            setTimeout(executeWithRetry, delay);
          } else {
            console.error(`[FallbackQueue:${this.name}] Job ${job.id} exhausted retries. Moving to DLQ.`);
            if (communicationDLQ && communicationDLQ.processor) {
              communicationDLQ.processor({ ...job, failedReason: err.message });
            }
          }
        }
      };

      executeWithRetry();
    });
    return { id: `FB-${Date.now()}` };
  }

  registerWorker(processor) {
    this.processor = processor;
  }
}

let eventBusQueue, communicationQueue, communicationDLQ;

if (useBullMQ && Queue) {
  eventBusQueue      = new Queue('eventBusQueue', { connection, defaultJobOptions });
  communicationQueue = new Queue('communicationQueue', { connection, defaultJobOptions });
  communicationDLQ   = new Queue('communicationDLQ', { connection });
} else {
  eventBusQueue      = new FallbackQueue('eventBusQueue');
  communicationQueue = new FallbackQueue('communicationQueue');
  communicationDLQ   = new FallbackQueue('communicationDLQ');
}

module.exports = {
  eventBusQueue,
  communicationQueue,
  communicationDLQ,
  useBullMQ,
  connection
};
