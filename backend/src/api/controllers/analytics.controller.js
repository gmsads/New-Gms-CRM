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

    // ── Main Metrics Aggregation ──────────────────────────────────────────────
    const [mainStats, productStats, clientStats, execStats, orderApprovals, paymentApprovals] = await Promise.all([
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
      Payment.countDocuments({ status: 'Pending' })
    ]);

    const stats = mainStats[0] || { totalSales: 0, totalPaid: 0, totalPending: 0, count: 0 };
    
    // Sort products for top/least
    const topProducts = productStats.slice(0, 5);
    const leastProducts = productStats.length > 5 ? productStats.slice(-5).reverse() : [];

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
        executives: execStats
      }
    });
  } catch (err) {
    console.error('[ANALYTICS_ERROR]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
