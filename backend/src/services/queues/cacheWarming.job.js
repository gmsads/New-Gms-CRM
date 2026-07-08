const { Queue, Worker } = require('bullmq');
const { redisClient, setCache } = require('../cache/redis.service');
const analyticsController = require('../../api/controllers/analytics.controller');

// Need a mock request to pass to analytics functions if they expect req/res
// However, it's better to extract the logic out of the controller.
// Since the prompt specifies to prevent aggregations on user requests, we will run the queries here.

const Order = require('../../domains/orders/order.model');
const Prospect = require('../../domains/sales/prospects/prospect.model');

const cacheWarmingQueue = new Queue('cacheWarmingQueue', { connection: redisClient });

const worker = new Worker('cacheWarmingQueue', async (job) => {
  console.log('[CACHE WARMING] Starting Dashboard Analytics Refresh...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Sales Stats
    const [todaySales, monthlySales, activeProspects] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$financials.totalAmount' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: firstDayOfMonth }, status: { $ne: 'Cancelled' } } },
        { $group: { _id: null, total: { $sum: '$financials.totalAmount' } } }
      ]),
      Prospect.countDocuments({ status: { $in: ['New', 'Contacted', 'Proposal_Sent'] } })
    ]);

    const dashboardStats = {
      todaySales: todaySales[0]?.total || 0,
      todayOrders: todaySales[0]?.count || 0,
      monthlySales: monthlySales[0]?.total || 0,
      activeProspects,
      lastUpdated: new Date()
    };

    // Cache the global stats (TTL 10 mins, though we refresh every 5)
    await setCache('dashboard:global:stats', dashboardStats, 600);
    
    console.log('[CACHE WARMING] Dashboard Analytics Refreshed Successfully.');
  } catch (error) {
    console.error('[CACHE WARMING] Failed:', error.message);
  }
}, { connection: redisClient });

// Schedule to run every 5 minutes
cacheWarmingQueue.add('refreshDashboard', {}, {
  repeat: {
    pattern: '*/5 * * * *' // Every 5 mins
  }
});

module.exports = { cacheWarmingQueue };
