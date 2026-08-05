const queueFactory = require('./queueFactory');
let serverAdapter = null;
let connection = null;

if (queueFactory._isBullMQ()) {
  try {
    const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
    const { createBullBoard } = require('@bull-board/api');
    const { ExpressAdapter } = require('@bull-board/express');
    serverAdapter = new ExpressAdapter();
    serverAdapter.setBasePath('/api/admin/queues');
  } catch (err) {
    console.warn('[QueueManager] bull-board not installed. Admin board disabled.');
  }
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
let notificationQueue, escalationQueue, reminderQueue, exportQueue, telephonyQueue, recordingQueue;

if (queueFactory._isBullMQ()) {
  notificationQueue = queueFactory.getQueue('notificationQueue', defaultJobOptions);
  escalationQueue = queueFactory.getQueue('escalationQueue', defaultJobOptions);
  reminderQueue = queueFactory.getQueue('reminderQueue', defaultJobOptions);
  exportQueue = queueFactory.getQueue('exportQueue', defaultJobOptions);
  telephonyQueue = queueFactory.getQueue('telephonyQueue', defaultJobOptions);
  recordingQueue = queueFactory.getQueue('recordingQueue', defaultJobOptions);

  // Initialize Workers
  const notificationWorker = queueFactory.createWorker('notificationQueue', async job => {
    console.log(`[Queue] Processing notification job ${job.id}`);
    const { type, data } = job.data;
    const notificationWorkflow = require('../workflows/notificationWorkflow.service');
    
    if (type === 'SEND_DIRECT') {
      await notificationWorkflow.sendNotification(data);
    } else if (type === 'BROADCAST_ROLE') {
      await notificationWorkflow.broadcastToRole(data.role, data.payload);
    }
  });

  const escalationWorker = queueFactory.createWorker('escalationQueue', async job => {
    console.log(`[Queue] Processing escalation job ${job.id}`);
    const escalationWorkflow = require('../workflows/escalationWorkflow.service');
    if (job.data.task === 'CHECK_OVERDUE') {
      await escalationWorkflow.checkOverdueAppointments();
    }
  });

  const reminderWorker = queueFactory.createWorker('reminderQueue', async job => {
    console.log(`[Queue] Processing reminder job ${job.id}`);
    const escalationWorkflow = require('../workflows/escalationWorkflow.service');
    if (job.data.task === 'CHECK_FOLLOWUPS') {
      await escalationWorkflow.checkFollowupReminders();
    }
  });

  const exportWorker = queueFactory.createWorker('exportQueue', async job => {
    console.log(`[Queue] Processing export job ${job.id}`);
    // Export logic would go here
  });

  const telephonyWorker = queueFactory.createWorker('telephonyQueue', async job => {
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
  });

  const recordingWorker = queueFactory.createWorker('recordingQueue', async job => {
    console.log(`[Queue] Processing recording job ${job.id}`);
    // Background recording processing / S3 sync retry
  });

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
  telephonyQueue = makeMockQueue('telephonyQueue');
  recordingQueue = makeMockQueue('recordingQueue');
}

module.exports = {
  notificationQueue,
  escalationQueue,
  reminderQueue,
  exportQueue,
  telephonyQueue,
  recordingQueue,
  connection,
  serverAdapter
};
