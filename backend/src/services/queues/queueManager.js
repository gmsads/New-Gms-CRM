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
let notificationQueue, escalationQueue, reminderQueue, exportQueue, cacheWarmingQueue, archiveQueue, telephonyQueue, recordingQueue;

if (Queue && Worker) {
  notificationQueue = new Queue('notificationQueue', { connection, defaultJobOptions });
  escalationQueue = new Queue('escalationQueue', { connection, defaultJobOptions });
  reminderQueue = new Queue('reminderQueue', { connection, defaultJobOptions });
  exportQueue = new Queue('exportQueue', { connection, defaultJobOptions });
  cacheWarmingQueue = require('./cacheWarming.job').cacheWarmingQueue;
  archiveQueue = require('./archive.job').archiveQueue;
  telephonyQueue = new Queue('telephonyQueue', { connection, defaultJobOptions });
  recordingQueue = new Queue('recordingQueue', { connection, defaultJobOptions });

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

  const telephonyWorker = new Worker('telephonyQueue', async job => {
    console.log(`[Queue] Processing telephony webhook job ${job.id}`);
    const { provider, payload } = job.data;
    const telephonyAdapters = require('../../domains/telecrm/services/telephonyAdapters.service');
    const callLifecycle = require('../../domains/telecrm/services/callLifecycle.service');
    const LeadCall = require('../../domains/telecrm/models/leadCall.model');

    const normalized = telephonyAdapters.normalizeWebhook(provider, payload);
    let call = null;
    if (normalized.providerCallId) {
      call = await LeadCall.findOne({ providerCallId: normalized.providerCallId });
    }
    if (!call && normalized.calleePhone) {
      const cleanPhone = normalized.calleePhone.replace(/\D/g, '').slice(-10);
      call = await LeadCall.findOne({ calleePhone: { $regex: cleanPhone } }).sort({ createdAt: -1 });
    }
    if (call) {
      await callLifecycle.transitionStage({
        callId: call._id,
        newStage: normalized.status || 'Completed',
        timestamp: new Date(),
        metadata: {
          recordingUrl: normalized.recordingUrl,
          durationSeconds: normalized.durationSeconds,
          talkDuration: normalized.durationSeconds
        }
      });
    }
  }, { connection });

  const recordingWorker = new Worker('recordingQueue', async job => {
    console.log(`[Queue] Processing recording job ${job.id}`);
    // Background recording processing / S3 sync retry
  }, { connection });

  // Handle worker events
  [notificationWorker, escalationWorker, reminderWorker, exportWorker, telephonyWorker, recordingWorker].forEach(worker => {
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
      new BullMQAdapter(archiveQueue),
      new BullMQAdapter(telephonyQueue),
      new BullMQAdapter(recordingQueue)
    ],
    serverAdapter: serverAdapter,
  });
} else {
  const makeMockQueue = (name) => ({
    name,
    add: async (jobName, data = {}) => {
      console.log(`[MockQueue:${name}] Processing job ${jobName} in memory.`);
      if (name === 'telephonyQueue') {
        try {
          const telephonyAdapters = require('../../domains/telecrm/services/telephonyAdapters.service');
          const callLifecycle = require('../../domains/telecrm/services/callLifecycle.service');
          const LeadCall = require('../../domains/telecrm/models/leadCall.model');
          const normalized = telephonyAdapters.normalizeWebhook(data.provider, data.payload);
          let call = null;
          if (normalized.providerCallId) call = await LeadCall.findOne({ providerCallId: normalized.providerCallId });
          if (!call && normalized.calleePhone) {
            const cleanPhone = normalized.calleePhone.replace(/\D/g, '').slice(-10);
            call = await LeadCall.findOne({ calleePhone: { $regex: cleanPhone } }).sort({ createdAt: -1 });
          }
          if (call) {
            await callLifecycle.transitionStage({
              callId: call._id,
              newStage: normalized.status || 'Completed',
              timestamp: new Date(),
              metadata: {
                recordingUrl: normalized.recordingUrl,
                durationSeconds: normalized.durationSeconds,
                talkDuration: normalized.durationSeconds
              }
            });
          }
        } catch (err) {
          console.error(`[MockQueue:${name}] Error:`, err.message);
        }
      }
      return { id: `mock-${Date.now()}` };
    }
  });

  notificationQueue = makeMockQueue('notificationQueue');
  escalationQueue = makeMockQueue('escalationQueue');
  reminderQueue = makeMockQueue('reminderQueue');
  exportQueue = makeMockQueue('exportQueue');
  cacheWarmingQueue = makeMockQueue('cacheWarmingQueue');
  archiveQueue = makeMockQueue('archiveQueue');
  telephonyQueue = makeMockQueue('telephonyQueue');
  recordingQueue = makeMockQueue('recordingQueue');
}

module.exports = {
  notificationQueue,
  escalationQueue,
  reminderQueue,
  exportQueue,
  cacheWarmingQueue,
  archiveQueue,
  telephonyQueue,
  recordingQueue,
  connection,
  serverAdapter
};
