const mongoose = require('mongoose');
const Order = require('../../domains/orders/order.model');
const Prospect = require('../../domains/pipeline/prospect.model');
const Task = require('../../domains/sales/task.model');
const Target = require('../../domains/targets/target.model');
const PerformanceSnapshot = require('../../domains/performance/performanceSnapshot.model');
const KpiConfig = require('../../domains/performance/kpiConfig.model');
const User = require('../../domains/users/user.model');

// ==========================================
// Phase 3: Aggregation Engines (Backend)
// ==========================================

// --- 1. IPS (Individual Performance Score) Engine ---
exports.calculateIPS = async (userId, periodStart, periodEnd) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  const kpis = await KpiConfig.find({ role: user.role, isActive: true });
  if (kpis.length === 0) return { ips: 0, grade: 'F', metrics: [] };

  let totalWeightedScore = 0;
  let totalWeightage = 0;
  const metrics = [];

  for (const kpi of kpis) {
    let actualValue = 0;

    // Execute logic based on baseMetric
    if (kpi.baseMetric === 'REVENUE_ACHIEVED') {
      const orders = await Order.aggregate([
        { $match: { salesExec: user._id, status: 'Confirmed', createdAt: { $gte: periodStart, $lte: periodEnd } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]);
      actualValue = orders.length > 0 ? orders[0].total : 0;
    } else if (kpi.baseMetric === 'CONVERSION_RATE') {
      const prospects = await Prospect.countDocuments({ salesExec: user._id, createdAt: { $gte: periodStart, $lte: periodEnd } });
      const converted = await Order.countDocuments({ salesExec: user._id, status: 'Confirmed', createdAt: { $gte: periodStart, $lte: periodEnd } });
      actualValue = prospects > 0 ? (converted / prospects) * 100 : 0;
    } else if (kpi.baseMetric === 'TURNAROUND_TIME') {
      const completedTasks = await Task.find({ assignedTo: user._id, status: 'Completed', createdAt: { $gte: periodStart, $lte: periodEnd } });
      if (completedTasks.length > 0) {
        const totalHrs = completedTasks.reduce((sum, task) => {
          return sum + (new Date(task.updatedAt) - new Date(task.createdAt)) / (1000 * 60 * 60);
        }, 0);
        actualValue = totalHrs / completedTasks.length;
      }
    }
    // ... logic for other metrics can be added ...

    let score = 0;
    if (kpi.formulaLogic === 'PERCENTAGE') {
      score = kpi.targetValue > 0 ? Math.min((actualValue / kpi.targetValue) * 100, 100) : 0;
    } else if (kpi.formulaLogic === 'HIGHER_IS_BETTER') {
      score = actualValue >= kpi.targetValue ? 100 : (actualValue / kpi.targetValue) * 100;
    } else if (kpi.formulaLogic === 'LOWER_IS_BETTER') {
      score = actualValue <= kpi.targetValue ? 100 : Math.max(100 - ((actualValue - kpi.targetValue) / kpi.targetValue * 100), 0);
    }

    const weightedScore = (score * kpi.weightage) / 100;
    totalWeightedScore += weightedScore;
    totalWeightage += kpi.weightage;

    metrics.push({
      kpiId: kpi._id,
      kpiName: kpi.name,
      actualValue,
      targetValue: kpi.targetValue,
      score,
      weightedScore
    });
  }

  // Normalize IPS to 100 scale
  const ips = totalWeightage > 0 ? (totalWeightedScore / totalWeightage) * 100 : 0;
  
  let grade = 'F';
  if (ips >= 90) grade = 'A+';
  else if (ips >= 80) grade = 'A';
  else if (ips >= 70) grade = 'B';
  else if (ips >= 60) grade = 'C';
  else if (ips >= 50) grade = 'D';

  return { ips: Math.round(ips), grade, metrics };
};

// --- 2. TPS (Team Performance Score) Engine ---
exports.calculateTPS = async (managerId, periodStart, periodEnd) => {
  // Find users managed by this manager (e.g. salesExecs where salesManager = managerId)
  // Or simply users in the same team. We'll use a simple proxy for now:
  const teamMembers = await User.find({ reportsTo: managerId });
  if (teamMembers.length === 0) return { tps: 0, grade: 'F' };

  let totalIps = 0;
  for (const member of teamMembers) {
    const { ips } = await exports.calculateIPS(member._id, periodStart, periodEnd);
    totalIps += ips;
  }

  const avgIps = totalIps / teamMembers.length;
  // Apply a 30% SLA score multiplier for managers (stubbed to 90 for now)
  const managerSLAScore = 90; 
  const tps = (0.7 * avgIps) + (0.3 * managerSLAScore);

  let grade = 'F';
  if (tps >= 90) grade = 'A+';
  else if (tps >= 80) grade = 'A';
  else if (tps >= 70) grade = 'B';
  else if (tps >= 60) grade = 'C';
  else if (tps >= 50) grade = 'D';

  return { tps: Math.round(tps), grade, teamCount: teamMembers.length, avgIps: Math.round(avgIps) };
};

// --- 3. Bottleneck Detection Engine ---
exports.detectBottlenecks = async () => {
  const pendingOrders = await Order.find({ verificationStatus: 'Pending' })
    .populate('salesExec', 'name')
    .sort({ createdAt: 1 })
    .limit(10);
  
  const pendingDesigns = await Order.find({ designStatus: 'Pending' })
    .populate('assignedDesigner', 'name')
    .sort({ createdAt: 1 })
    .limit(10);

  return {
    verificationBottlenecks: pendingOrders.map(o => ({ orderId: o.orderNumber, owner: o.salesExec?.name, ageDays: (new Date() - o.createdAt)/(1000*60*60*24) })),
    designBottlenecks: pendingDesigns.map(o => ({ orderId: o.orderNumber, owner: o.assignedDesigner?.name, ageDays: (new Date() - o.createdAt)/(1000*60*60*24) }))
  };
};

// --- 4. AI Insight Engine ---
exports.generateInsights = async (userId) => {
  const insights = [];
  
  // Example Rule 1: Check Follow-up Adherence drop
  // In a real scenario, this compares two periods. We mock the insight for now.
  insights.push({
    priority: 'High',
    message: 'Follow-up compliance reduced by 8% this week. This is affecting prospect conversion rates.',
    recommendedAction: 'Schedule a pipeline review with your team to clear overdue tasks.'
  });

  // Example Rule 2: Order Bottlenecks
  const pendingOrdersCount = await Order.countDocuments({ verificationStatus: 'Pending' });
  if (pendingOrdersCount > 10) {
    insights.push({
      priority: 'Critical',
      message: `${pendingOrdersCount} orders are stuck pending verification.`,
      recommendedAction: 'Escalate to Accounts department to clear the queue.'
    });
  }

  return insights;
};

// --- 5. Employee Health Index Engine ---
exports.calculateEmployeeHealth = async (userId) => {
  // Logic integrates Attendance, Leaves, and IPS drop over time
  // Returning mock health status based on IPS (for phase 1 structural implementation)
  const ipsData = await exports.calculateIPS(userId, new Date(new Date().setMonth(new Date().getMonth() - 1)), new Date());
  
  let status = 'Healthy';
  if (ipsData.ips < 50) status = 'Critical';
  else if (ipsData.ips < 65) status = 'At Risk';
  else if (ipsData.ips < 75) status = 'Monitor';

  return {
    healthStatus: status,
    ipsTrend: ipsData.ips,
    issuesDetected: status !== 'Healthy' ? ['Low Productivity', 'Declining target achievement'] : []
  };
};
