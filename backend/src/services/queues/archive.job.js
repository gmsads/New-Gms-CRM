const { Queue, Worker } = require('bullmq');
const { redisClient } = require('../cache/redis.service');
const mongoose = require('mongoose');
const Order = require('../../domains/orders/order.model');

// Instead of maintaining duplicate schemas, we can archive into a dynamic collection 
// or define generic schemas. We'll use a raw db.collection.insertMany approach for speed.

const archiveQueue = new Queue('archiveQueue', { connection: redisClient });

const worker = new Worker('archiveQueue', async (job) => {
  console.log('[ARCHIVE JOB] Starting database archival...');
  try {
    const db = mongoose.connection.db;
    
    // Archive orders older than 2 years that are Completed or Cancelled
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const filter = {
      createdAt: { $lt: twoYearsAgo },
      status: { $in: ['Completed', 'Cancelled'] }
    };

    const oldOrders = await Order.find(filter).lean();
    
    if (oldOrders.length > 0) {
      console.log(`[ARCHIVE JOB] Found ${oldOrders.length} orders to archive.`);
      await db.collection('orders_archive').insertMany(oldOrders);
      
      const idsToDelete = oldOrders.map(o => o._id);
      await Order.deleteMany({ _id: { $in: idsToDelete } });
      
      console.log(`[ARCHIVE JOB] Successfully archived and removed ${oldOrders.length} orders.`);
    } else {
      console.log(`[ARCHIVE JOB] No orders to archive at this time.`);
    }

  } catch (error) {
    console.error('[ARCHIVE JOB] Failed:', error.message);
  }
}, { connection: redisClient });

// Schedule to run every Sunday at 2 AM
archiveQueue.add('archiveOldData', {}, {
  repeat: {
    pattern: '0 2 * * 0'
  }
});

module.exports = { archiveQueue };
