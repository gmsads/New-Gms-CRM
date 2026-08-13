const mongoose = require('mongoose');
const Order = require('../../domains/orders/order.model');
const LeadCall = require('../../domains/telecrm/models/leadCall.model');
const Visit = require('../../domains/field/visits/visit.model');
const Payment = require('../../domains/payments/payment.model');
const User = require('../../domains/users/user.model');

/**
 * Returns IST Start and End Date objects for a given YYYY-MM-DD
 */
const getISTBoundaries = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - (5.5 * 60 * 60 * 1000));
  return { start, end };
};

exports.getEnterpriseDailyWork = async (dateStr, departmentFilter = null, user = null) => {
  const { start, end } = getISTBoundaries(dateStr);

  const [
    salesCalls,
    salesOrders,
    fieldVisits,
    productionStats,
    designStats,
    serviceStats,
    paymentsCollected,
    paymentsVerified,
    activeUsers
  ] = await Promise.all([
    // 1. Sales - Calls
    LeadCall.aggregate([
      { 
        $match: { 
          $or: [
            { startTime: { $gte: start, $lte: end } },
            { callConnectTime: { $gte: start, $lte: end } }
          ]
        } 
      },
      { 
        $group: {
          _id: '$callerId',
          callsMade: { $sum: 1 },
          callsConnected: { $sum: { $cond: [{ $eq: ['$callStatus', 'Connected'] }, 1, 0] } }
        } 
      }
    ]),

    // 2. Sales - Orders
    Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { 
        $group: {
          _id: '$salesExec',
          ordersCreated: { $sum: 1 },
          revenueGenerated: { $sum: '$grandTotal' }
        } 
      }
    ]),

    // 3. Field - Visits
    Visit.aggregate([
      { 
        $match: { 
          $or: [
            { 'checkIn.time': { $gte: start, $lte: end } },
            { 'checkOut.time': { $gte: start, $lte: end } }
          ]
        } 
      },
      { 
        $group: {
          _id: '$assignedTo',
          visitsCompleted: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          visitsInProgress: { $sum: { $cond: [{ $in: ['$status', ['In Progress', 'Started', 'Check-In']] }, 1, 0] } },
          totalVisits: { $sum: 1 }
        } 
      }
    ]),

    // 4. Production - Line Items
    Order.aggregate([
      { 
        $match: { 
          $or: [
            { 'lineItems.productionWorkflow.actualCompletion': { $gte: start, $lte: end } },
            { 'lineItems.productionWorkflow.startedAt': { $gte: start, $lte: end } },
            { 'lineItems.productionWorkflow.qcCompletedAt': { $gte: start, $lte: end } }
          ]
        } 
      },
      { $unwind: '$lineItems' },
      { 
        $match: { 
          $or: [
            { 'lineItems.productionWorkflow.actualCompletion': { $gte: start, $lte: end } },
            { 'lineItems.productionWorkflow.startedAt': { $gte: start, $lte: end } },
            { 'lineItems.productionWorkflow.qcCompletedAt': { $gte: start, $lte: end } }
          ]
        } 
      },
      { 
        $group: {
          _id: '$lineItems.productionWorkflow.productionExecutiveId',
          productionCompleted: { $sum: { $cond: [{ $and: [{ $gte: ['$lineItems.productionWorkflow.actualCompletion', start] }, { $lte: ['$lineItems.productionWorkflow.actualCompletion', end] }] }, 1, 0] } },
          productionStarted: { $sum: { $cond: [{ $and: [{ $gte: ['$lineItems.productionWorkflow.startedAt', start] }, { $lte: ['$lineItems.productionWorkflow.startedAt', end] }] }, 1, 0] } },
          qcCompleted: { $sum: { $cond: [{ $and: [{ $gte: ['$lineItems.productionWorkflow.qcCompletedAt', start] }, { $lte: ['$lineItems.productionWorkflow.qcCompletedAt', end] }] }, 1, 0] } }
        } 
      }
    ]),

    // 5. Design - Line Items
    Order.aggregate([
      { 
        $match: { 
          $or: [
            { 'lineItems.designerWorkflow.completedAt': { $gte: start, $lte: end } },
            { 'lineItems.designerWorkflow.startedAt': { $gte: start, $lte: end } }
          ]
        } 
      },
      { $unwind: '$lineItems' },
      { $unwind: { path: '$lineItems.designerWorkflow.assignedDesigners', preserveNullAndEmptyArrays: false } },
      { 
        $match: { 
          $or: [
            { 'lineItems.designerWorkflow.completedAt': { $gte: start, $lte: end } },
            { 'lineItems.designerWorkflow.startedAt': { $gte: start, $lte: end } }
          ]
        } 
      },
      { 
        $group: {
          _id: '$lineItems.designerWorkflow.assignedDesigners.userId',
          designsCompleted: { $sum: { $cond: [{ $and: [{ $gte: ['$lineItems.designerWorkflow.completedAt', start] }, { $lte: ['$lineItems.designerWorkflow.completedAt', end] }] }, 1, 0] } },
          designsStarted: { $sum: { $cond: [{ $and: [{ $gte: ['$lineItems.designerWorkflow.startedAt', start] }, { $lte: ['$lineItems.designerWorkflow.startedAt', end] }] }, 1, 0] } }
        } 
      }
    ]),

    // 6. Service - Line Items
    Order.aggregate([
      { 
        $match: { 
          $or: [
            { 'lineItems.serviceWorkflow.completedAt': { $gte: start, $lte: end } },
            { 'lineItems.serviceWorkflow.startedAt': { $gte: start, $lte: end } }
          ]
        } 
      },
      { $unwind: '$lineItems' },
      { 
        $match: { 
          $or: [
            { 'lineItems.serviceWorkflow.completedAt': { $gte: start, $lte: end } },
            { 'lineItems.serviceWorkflow.startedAt': { $gte: start, $lte: end } }
          ]
        } 
      },
      { 
        $group: {
          _id: '$lineItems.serviceWorkflow.serviceExecutiveId',
          serviceCompleted: { $sum: { $cond: [{ $and: [{ $gte: ['$lineItems.serviceWorkflow.completedAt', start] }, { $lte: ['$lineItems.serviceWorkflow.completedAt', end] }] }, 1, 0] } },
          serviceStarted: { $sum: { $cond: [{ $and: [{ $gte: ['$lineItems.serviceWorkflow.startedAt', start] }, { $lte: ['$lineItems.serviceWorkflow.startedAt', end] }] }, 1, 0] } }
        } 
      }
    ]),

    // 7. Accounts - Collection
    Payment.aggregate([
      { $match: { collectedAt: { $gte: start, $lte: end } } },
      { 
        $group: {
          _id: '$collectedBy',
          paymentsCollected: { $sum: 1 },
          amountCollected: { $sum: '$amount' }
        } 
      }
    ]),

    // 8. Accounts - Verification
    Payment.aggregate([
      { $match: { verifiedAt: { $gte: start, $lte: end } } },
      { 
        $group: {
          _id: '$verifiedBy',
          paymentsVerified: { $sum: 1 },
          amountVerified: { $sum: '$amount' }
        } 
      }
    ]),

    // 9. Base Active Users
    User.find({ status: 'ACTIVE' }, 'name role department status').lean()
  ]);

  // Aggregate all unique user IDs involved in ANY activity
  const allResultSets = [
    salesCalls, salesOrders, fieldVisits, productionStats, 
    designStats, serviceStats, paymentsCollected, paymentsVerified
  ];
  
  const activeUserMap = new Map();
  activeUsers.forEach(u => activeUserMap.set(u._id.toString(), u));

  const historicalUserIds = new Set();
  allResultSets.forEach(set => {
    set.forEach(item => {
      if (item._id && !activeUserMap.has(item._id.toString())) {
        historicalUserIds.add(item._id.toString());
      }
    });
  });

  // Fetch inactive/historical users who had activity
  const historicalUsers = historicalUserIds.size > 0 
    ? await User.find({ _id: { $in: Array.from(historicalUserIds) } }, 'name role department status').lean()
    : [];

  historicalUsers.forEach(u => activeUserMap.set(u._id.toString(), u));

  // Build employee activity map
  const employeeMap = new Map();

  // Helper to init employee
  const initEmployee = (userId) => {
    const idStr = userId.toString();
    if (!employeeMap.has(idStr)) {
      const u = activeUserMap.get(idStr) || { name: 'Unknown', role: 'Unknown', department: 'Unknown', status: 'INACTIVE' };
      employeeMap.set(idStr, {
        employeeId: idStr,
        employeeName: u.name,
        role: u.role,
        department: u.department || 'Unassigned',
        status: u.status,
        metrics: {}
      });
    }
    return employeeMap.get(idStr);
  };

  // Pre-seed all active users (to show zeros if no activity)
  activeUsers.forEach(u => initEmployee(u._id));

  // Merge metrics safely
  const mergeMetrics = (dataArray, keyMap) => {
    dataArray.forEach(item => {
      if (!item._id) return;
      const emp = initEmployee(item._id);
      Object.keys(keyMap).forEach(k => {
        emp.metrics[k] = (emp.metrics[k] || 0) + (item[keyMap[k]] || 0);
      });
    });
  };

  mergeMetrics(salesCalls, { callsMade: 'callsMade', callsConnected: 'callsConnected' });
  mergeMetrics(salesOrders, { ordersCreated: 'ordersCreated', revenueGenerated: 'revenueGenerated' });
  mergeMetrics(fieldVisits, { visitsCompleted: 'visitsCompleted', visitsInProgress: 'visitsInProgress', totalVisits: 'totalVisits' });
  mergeMetrics(productionStats, { productionCompleted: 'productionCompleted', productionStarted: 'productionStarted', qcCompleted: 'qcCompleted' });
  mergeMetrics(designStats, { designsCompleted: 'designsCompleted', designsStarted: 'designsStarted' });
  mergeMetrics(serviceStats, { serviceCompleted: 'serviceCompleted', serviceStarted: 'serviceStarted' });
  mergeMetrics(paymentsCollected, { paymentsCollected: 'paymentsCollected', amountCollected: 'amountCollected' });
  mergeMetrics(paymentsVerified, { paymentsVerified: 'paymentsVerified', amountVerified: 'amountVerified' });

  // --- SERVER-SIDE ROLE-BASED ACCESS CONTROL (RBAC) SCOPING ---
  let targetUserIds = null;
  if (user && !['ADMIN', 'MD_CEO'].includes(user.role)) {
    if (user.role.includes('MANAGER') || user.role === 'HR') {
      const team = await User.find({ reportingManager: user._id }).select('_id').lean();
      targetUserIds = new Set([user._id.toString(), ...team.map(t => t._id.toString())]);
    } else {
      targetUserIds = new Set([user._id.toString()]);
    }
  }

  // Group by Department
  const departmentGroups = {};

  employeeMap.forEach(emp => {
    // CRITICAL: Strictly enforce backend security. Drop any employee not in target scope.
    if (targetUserIds && !targetUserIds.has(emp.employeeId)) return;

    // If department filter is active, skip others
    if (departmentFilter && emp.department !== departmentFilter && departmentFilter !== 'All') return;

    if (!departmentGroups[emp.department]) {
      departmentGroups[emp.department] = {
        department: emp.department,
        summary: {},
        employees: []
      };
    }
    
    // Add common high-level summary logic per employee
    let hasActivity = false;
    let completed = 0;
    let inProgress = 0;

    // Sales metrics
    completed += (emp.metrics.ordersCreated || 0);
    // Field metrics
    completed += (emp.metrics.visitsCompleted || 0);
    inProgress += (emp.metrics.visitsInProgress || 0);
    // Production metrics
    completed += (emp.metrics.productionCompleted || 0);
    inProgress += (emp.metrics.productionStarted || 0);
    // Design metrics
    completed += (emp.metrics.designsCompleted || 0);
    inProgress += (emp.metrics.designsStarted || 0);
    // Service metrics
    completed += (emp.metrics.serviceCompleted || 0);
    inProgress += (emp.metrics.serviceStarted || 0);
    // Accounts metrics
    completed += (emp.metrics.paymentsCollected || 0) + (emp.metrics.paymentsVerified || 0);

    if (Object.keys(emp.metrics).length > 0) hasActivity = true;
    
    emp.hasActivity = hasActivity;
    emp.commonCompleted = completed;
    emp.commonInProgress = inProgress;

    departmentGroups[emp.department].employees.push(emp);
  });

  // Calculate Department and Organization Summaries
  const orgSummary = {
    totalEmployees: 0,
    employeesWithActivity: 0,
    completedWork: 0,
    inProgressWork: 0
  };

  const departmentsResponse = Object.values(departmentGroups).map(dept => {
    let deptEmployees = dept.employees.length;
    let deptWithActivity = 0;
    let deptCompleted = 0;
    let deptInProgress = 0;

    dept.employees.forEach(emp => {
      if (emp.hasActivity) deptWithActivity++;
      deptCompleted += emp.commonCompleted;
      deptInProgress += emp.commonInProgress;
    });

    dept.summary = {
      totalEmployees: deptEmployees,
      employeesWithActivity: deptWithActivity,
      completedWork: deptCompleted,
      inProgressWork: deptInProgress
    };

    orgSummary.totalEmployees += deptEmployees;
    orgSummary.employeesWithActivity += deptWithActivity;
    orgSummary.completedWork += deptCompleted;
    orgSummary.inProgressWork += deptInProgress;

    // Sort employees: with activity first, then by name
    dept.employees.sort((a, b) => {
      if (a.hasActivity === b.hasActivity) return a.employeeName.localeCompare(b.employeeName);
      return b.hasActivity ? 1 : -1;
    });

    return dept;
  });

  // Sort departments alphabetically
  departmentsResponse.sort((a, b) => a.department.localeCompare(b.department));

  return {
    date: dateStr,
    summary: orgSummary,
    departments: departmentsResponse
  };
};
