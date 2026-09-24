const Order = require('../../domains/orders/order.model');
const Prospect = require('../../domains/sales/prospects/prospect.model');
const User = require('../../domains/users/user.model');
const OrderApproval = require('../../domains/approvals/approval.model');
const Payment = require('../../domains/payments/payment.model');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
  try {
    const { month, year, area } = req.query;
    const filter = { status: { $ne: 'Cancelled' } };

    // ... [existing temporal and area filter logic remains] ...

    // ── Apply Temporal Filters ────────────────────────────────────────────────
    if (year) {
      const y = parseInt(year);
      if (month) {
        const m = parseInt(month) - 1; // 0-indexed
        filter.createdAt = {
          $gte: new Date(y, m, 1),
          $lt: new Date(y, m + 1, 1)
        };
      } else {
        filter.createdAt = {
          $gte: new Date(y, 0, 1),
          $lt: new Date(y + 1, 0, 1)
        };
      }
    }

    // ── Apply Area Filter ─────────────────────────────────────────────────────
    if (area) {
      filter.deliveryAddress = { $regex: area, $options: 'i' };
    }

    // ── Trend Data Calculation (Weekly & Monthly) ─────────────────────────────
    let targetYear = year ? parseInt(year) : new Date().getFullYear();
    let targetMonth = month ? parseInt(month) : new Date().getMonth() + 1; // 1-12

    // 3 Months range
    const endDate3m = new Date(targetYear, targetMonth, 1);
    const startDate3m = new Date(targetYear, targetMonth - 3, 1);

    // 1 Month range
    const startDate1m = new Date(targetYear, targetMonth - 1, 1);
    const endDate1m = new Date(targetYear, targetMonth, 1);

    // ── Main Metrics Aggregation ──────────────────────────────────────────────
    const [mainStats, productStats, clientStats, execStats, orderApprovals, paymentApprovals, monthlyStatsRaw, weeklyStatsRaw] = await Promise.all([
      // 1. Overall Financials
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$grandTotal' },
            totalPaid: { $sum: '$totalPaid' },
            totalPending: { $sum: '$balanceDue' },
            count: { $sum: 1 }
          }
        }
      ]),

      // 2. Product Performance (Top & Least Selling)
      Order.aggregate([
        { $match: filter },
        { $unwind: '$lineItems' },
        {
          $lookup: {
            from: 'orderservices',
            localField: 'lineItems',
            foreignField: '_id',
            as: 'service'
          }
        },
        { $unwind: '$service' },
        {
          $group: {
            _id: '$service.description',
            quantity: { $sum: '$service.quantity' },
            revenue: { $sum: '$service.amount' }
          }
        },
        { $sort: { quantity: -1 } }
      ]),

      // 3. Client Contributions
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$clientSnapshot.company',
            orders: { $sum: 1 },
            revenue: { $sum: '$grandTotal' }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]),

      // 4. Sales Executive Performance
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$salesExec',
            revenue: { $sum: '$grandTotal' },
            orders: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            name: '$user.name',
            revenue: 1,
            orders: 1
          }
        },
        { $sort: { revenue: -1 } }
      ]),

      // 5. Governance Items
      OrderApproval.countDocuments({ status: 'Pending' }),
      Payment.countDocuments({ status: 'Pending' }),

      // 6. Monthly Stats (Last 3 Months)
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: startDate3m, $lt: endDate3m } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: '$grandTotal' },
            orders: { $sum: 1 }
          }
        }
      ]),

      // 7. Weekly Stats (Current Month)
      Order.aggregate([
        { $match: { status: { $ne: 'Cancelled' }, createdAt: { $gte: startDate1m, $lt: endDate1m } } },
        {
          $group: {
            _id: { day: { $dayOfMonth: '$createdAt' } },
            revenue: { $sum: '$grandTotal' },
            orders: { $sum: 1 }
          }
        }
      ])
    ]);

    const stats = mainStats[0] || { totalSales: 0, totalPaid: 0, totalPending: 0, count: 0 };

    // Sort products for top/least
    const topProducts = productStats.slice(0, 5);
    const leastProducts = productStats.length > 5 ? productStats.slice(-5).reverse() : [];

    // Process Weekly Data
    const weeklyTrends = [
      { name: 'Week 1', revenue: 0, orders: 0 },
      { name: 'Week 2', revenue: 0, orders: 0 },
      { name: 'Week 3', revenue: 0, orders: 0 },
      { name: 'Week 4', revenue: 0, orders: 0 },
      { name: 'Week 5', revenue: 0, orders: 0 }
    ];

    if (weeklyStatsRaw) {
      weeklyStatsRaw.forEach(stat => {
        const day = stat._id.day;
        let weekIdx = 0;
        if (day > 28) weekIdx = 4;
        else if (day > 21) weekIdx = 3;
        else if (day > 14) weekIdx = 2;
        else if (day > 7) weekIdx = 1;

        weeklyTrends[weekIdx].revenue += stat.revenue || 0;
        weeklyTrends[weekIdx].orders += stat.orders || 0;
      });
    }

    // Process Monthly Data
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyTrends = [];
    for(let i=2; i>=0; i--) {
      // Create a date for the target month going backwards
      // For targetMonth (1-12), new Date(y, m-1, 1) is current month
      const d = new Date(targetYear, targetMonth - 1 - i, 1);
      const mName = monthNames[d.getMonth()];
      const y = d.getFullYear();
      const label = `${mName} ${y}`;

      const found = monthlyStatsRaw ? monthlyStatsRaw.find(s => s._id.year === y && s._id.month === d.getMonth() + 1) : null;
      monthlyTrends.push({
        name: label,
        revenue: found ? found.revenue : 0,
        orders: found ? found.orders : 0
      });
    }

    res.json({
      success: true,
      data: {
        financials: {
          totalSales: stats.totalSales,
          totalPaid: stats.totalPaid,
          totalPending: stats.totalPending,
          orderCount: stats.count
        },
        pendingApprovals: orderApprovals + paymentApprovals,
        products: {
          top: topProducts,
          least: leastProducts
        },
        clients: clientStats,
        executives: execStats,
        weeklyTrends,
        monthlyTrends
      }
    });
  } catch (err) {
    console.error('[ANALYTICS_ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
