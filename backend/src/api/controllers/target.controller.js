const mongoose = require('mongoose');
const Target = require('../../domains/targets/target.model');
const User = require('../../domains/users/user.model');
const Order = require('../../domains/orders/order.model');

// Create a new target
exports.assignTarget = async (req, res) => {
  try {
    const data = req.body;
    
    // Authorization check
    if (!['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'BRANCH_HEAD'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to assign targets.' });
    }

    const target = new Target({
      ...data,
      assignedBy: req.user._id,
      history: [{
        action: 'CREATED',
        performedBy: req.user._id,
        notes: 'Target assigned',
        newValue: data
      }]
    });

    await target.save();
    res.status(201).json({ success: true, data: target, message: 'Target assigned successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update an existing target
exports.updateTarget = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const target = await Target.findById(id);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Target not found' });
    }

    if (!['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'BRANCH_HEAD'].includes(req.user.role)) {
       return res.status(403).json({ success: false, message: 'You are not authorized to update targets.' });
    }

    const previousValue = target.toObject();

    Object.assign(target, updateData);
    
    target.history.push({
      action: 'UPDATED',
      performedBy: req.user._id,
      notes: 'Target details updated',
      previousValue,
      newValue: updateData
    });

    await target.save();
    res.json({ success: true, data: target, message: 'Target updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Update target progress
exports.updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { achievedValue, notes } = req.body;

    const target = await Target.findById(id);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found' });

    // Allow employee to update their own target, or managers
    if (target.employee.toString() !== req.user._id.toString() && !['ADMIN', 'MD_CEO', 'SALES_MANAGER', 'BRANCH_HEAD'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this target progress.' });
    }

    const previousValue = { achievedValue: target.achievedValue, status: target.status };
    
    target.achievedValue = achievedValue;
    
    target.history.push({
      action: 'PROGRESS_UPDATED',
      performedBy: req.user._id,
      notes: notes || 'Progress updated',
      previousValue,
      newValue: { achievedValue: target.achievedValue }
    });

    await target.save();
    res.json({ success: true, data: target, message: 'Progress updated.' });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// List targets with advanced filtering and RBAC
exports.listTargets = async (req, res) => {
  try {
    const { 
      branch, employee, department, role, period, 
      targetType, category, status, search, 
      page = 1, limit = 25 
    } = req.query;

    const filter = {};

    // Strict RBAC Logic
    if (['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC', 'TELE_EXEC'].includes(req.user.role)) {
      filter.employee = req.user._id; // Only see own targets
    } else if (req.user.role === 'SALES_MANAGER') {
      // Find all employees reporting to this manager (mock logic, adjust based on actual schema)
      const teamMembers = await User.find({ reportingManager: req.user._id }).select('_id');
      const teamIds = teamMembers.map(m => m._id);
      teamIds.push(req.user._id); // include manager's own targets
      filter.employee = { $in: teamIds };
    } else if (req.user.role === 'BRANCH_HEAD') {
      filter.branch = req.user.department; // Mock logic for branch
    }

    // Apply URL filters
    if (branch) filter.branch = branch;
    if (employee && !['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC', 'TELE_EXEC'].includes(req.user.role)) {
      if (req.user.role === 'SALES_MANAGER') {
        // If they provided an employee filter, ensure it's within their team (mocking this as a simple overwrite, but could add strict validation)
        // Let's just use $and to ensure both conditions are met.
        filter.$and = [{ employee: { $in: filter.employee.$in } }, { employee }];
        delete filter.employee;
      } else {
        filter.employee = employee;
      }
    }
    if (department) filter.department = department;
    if (role) filter.role = role;
    if (period) filter.period = period;
    if (targetType) filter.targetType = targetType;
    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const [targets, total] = await Promise.all([
      Target.find(filter)
        .populate('employee', 'name email role profileImage')
        .populate('assignedBy', 'name role')
        .sort({ endDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Target.countDocuments(filter)
    ]);

    const targetsWithProgress = await Promise.all(targets.map(async (target) => {
      if (target.targetType === 'Revenue Target' && target.employee) {
        const orders = await Order.find({
          salesExec: target.employee._id,
          createdAt: { $gte: target.startDate, $lte: target.endDate },
          status: { $nin: ['Cancelled'] }
        });
        const actualRevenue = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        target.achievedValue = Math.max(target.achievedValue || 0, actualRevenue);
      }
      return target;
    }));

    res.json({
      success: true,
      data: targetsWithProgress,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        hasMore: skip + targets.length < total
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Target Analytics Dashboard Data
exports.getAnalytics = async (req, res) => {
  try {
    const { branch, employee, period } = req.query;
    const match = {};

    // Basic RBAC
    if (['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC', 'TELE_EXEC'].includes(req.user.role)) {
      match.employee = new mongoose.Types.ObjectId(req.user._id);
    } else if (req.user.role === 'SALES_MANAGER') {
      const teamMembers = await User.find({ reportingManager: req.user._id }).select('_id');
      const teamIds = teamMembers.map(m => m._id);
      teamIds.push(req.user._id);
      match.employee = { $in: teamIds };
    } else if (req.user.role === 'BRANCH_HEAD') {
      match.branch = req.user.department;
    }

    // URL Filters
    if (branch) match.branch = branch;
    if (employee) match.employee = new mongoose.Types.ObjectId(employee);
    if (period) match.period = period;

    // Run aggregations
    const overview = await Target.aggregate([
      { $match: match },
      { $group: {
          _id: null,
          totalAssigned: { $sum: 1 },
          achieved: { $sum: { $cond: [{ $in: ['$status', ['Achieved', 'Overachieved']] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          missed: { $sum: { $cond: [{ $in: ['$status', ['Missed', 'Expired']] }, 1, 0] } }
      }}
    ]);

    // Branch-wise Performance
    const branchPerformance = await Target.aggregate([
      { $match: match },
      { $group: {
          _id: '$branch',
          totalTargets: { $sum: 1 },
          achievedTargets: { $sum: { $cond: [{ $in: ['$status', ['Achieved', 'Overachieved']] }, 1, 0] } }
      }},
      { $project: {
          branch: '$_id',
          achievementRate: { $multiply: [{ $divide: ['$achievedTargets', { $cond: [{ $eq: ['$totalTargets', 0] }, 1, '$totalTargets'] }] }, 100] }
      }},
      { $sort: { achievementRate: -1 } }
    ]);

    // Top Performers (Employees)
    const topPerformers = await Target.aggregate([
      { $match: { ...match, status: { $in: ['Achieved', 'Overachieved'] } } },
      { $group: {
          _id: '$employee',
          achievedCount: { $sum: 1 },
          totalScore: { $sum: '$weightage' }
      }},
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
      }},
      { $unwind: '$userDetails' },
      { $project: {
          name: '$userDetails.name',
          role: '$userDetails.role',
          achievedCount: 1,
          totalScore: 1
      }},
      { $sort: { achievedCount: -1, totalScore: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      data: {
        overview: overview[0] || { totalAssigned: 0, achieved: 0, pending: 0, inProgress: 0, missed: 0 },
        branchPerformance,
        topPerformers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
