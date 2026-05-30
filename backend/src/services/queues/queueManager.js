let Queue, Worker, Redis;
let connection = null;
let serverAdapter = null;

try {
  const bullmq = require('bullmq');
  Queue = bullmq.Queue;
  Worker = bullmq.Worker;
  const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
  const { createBullBoard } = require('@bull-board/api');
  const { ExpressAdapter } = require('@bull-board/express');

  // Re-use our centralized redis service
  const { redisClient } = require('../cache/redis.service');
  connection = redisClient;
  Redis = require('ioredis');

  serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/api/admin/queues');
} catch (err) {
  console.warn('[QueueManager] bullmq or ioredis not installed. Queue features disabled.');
}

// Use environment variables for Redis configuration
const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
};

// Define Default Job Options for Queue Reliability
const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5000 // 5s, 25s, 125s...
  },
  removeOnComplete: {
    age: 24 * 3600, // keep for 24h
    count: 1000
  },
  removeOnFail: {
    age: 7 * 24 * 3600 // keep failed for 7 days (DLQ equivalent)
  }
};

// Define Queues
let notificationQueue, escalationQueue, reminderQueue, exportQueue, cacheWarmingQueue, archiveQueue;

if (Queue && Worker) {
  notificationQueue = new Queue('notificationQueue', { connection, defaultJobOptions });
  escalationQueue = new Queue('escalationQueue', { connection, defaultJobOptions });
  reminderQueue = new Queue('reminderQueue', { connection, defaultJobOptions });
  exportQueue = new Queue('exportQueue', { connection, defaultJobOptions });
  cacheWarmingQueue = require('./cacheWarming.job').cacheWarmingQueue;
  archiveQueue = require('./archive.job').archiveQueue;

  // Initialize Workers
  const notificationWorker = new Worker('notificationQueue', async job => {
    console.log(`[Queue] Processing notification job ${job.id}`);
    const { type, data } = job.data;
    const notificationWorkflow = require('../workflows/notificationWorkflow.service');
    
    if (type === 'SEND_DIRECT') {
      await notificationWorkflow.sendNotification(data);
    } else if (type === 'BROADCAST_ROLE') {
      await notificationWorkflow.broadcastToRole(data.role, data.payload);
    }
  }, { connection });

  const escalationWorker = new Worker('escalationQueue', async job => {
    console.log(`[Queue] Processing escalation job ${job.id}`);
    const escalationWorkflow = require('../workflows/escalationWorkflow.service');
    if (job.data.task === 'CHECK_OVERDUE') {
      await escalationWorkflow.checkOverdueAppointments();
    }
  }, { connection });

  const reminderWorker = new Worker('reminderQueue', async job => {
    console.log(`[Queue] Processing reminder job ${job.id}`);
    const escalationWorkflow = require('../workflows/escalationWorkflow.service');
    if (job.data.task === 'CHECK_FOLLOWUPS') {
      await escalationWorkflow.checkFollowupReminders();
    }
  }, { connection });

  const exportWorker = new Worker('exportQueue', async job => {
    console.log(`[Queue] Processing export job ${job.id}`);
    // Export logic would go here
  }, { connection });

  // Handle worker events
  [notificationWorker, escalationWorker, reminderWorker, exportWorker].forEach(worker => {
    worker.on('completed', job => console.log(`[Queue] Job ${job.id} completed.`));
    worker.on('failed', (job, err) => console.error(`[Queue] Job ${job.id} failed:`, err));
  });

  const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
  const { createBullBoard } = require('@bull-board/api');

  createBullBoard({
    queues: [
      new BullMQAdapter(notificationQueue),
      new BullMQAdapter(escalationQueue),
      new BullMQAdapter(reminderQueue),
      new BullMQAdapter(exportQueue),
      new BullMQAdapter(cacheWarmingQueue),
      new BullMQAdapter(archiveQueue)
    ],
    serverAdapter: serverAdapter,
  });
}

module.exports = {
  notificationQueue,
  escalationQueue,
  reminderQueue,
  exportQueue,
  cacheWarmingQueue,
  archiveQueue,
  connection,
  serverAdapter
};
