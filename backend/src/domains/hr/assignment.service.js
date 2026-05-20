const User = require('../users/user.model');
const Assignment = require('./assignment.model');

/**
 * Finds the next available employee for a given role based on least recent assignment (Round Robin)
 * and least current workload.
 */
exports.assignRoundRobin = async (roleType, orderId, taskId, assignedBy = null) => {
  try {
    // 1. Find all active users with the requested role
    const candidates = await User.find({ role: roleType, status: 'ACTIVE' });
    
    if (candidates.length === 0) {
      throw new Error(`No active employees found for role: ${roleType}`);
    }

    // 2. Find workload/last assignment for each
    const workloadStats = await Promise.all(candidates.map(async (user) => {
      const activeCount = await Assignment.countDocuments({ assignedTo: user._id, status: { $in: ['ASSIGNED', 'IN_PROGRESS'] } });
      const lastAssigned = await Assignment.findOne({ assignedTo: user._id }).sort({ assignedAt: -1 });
      
      return {
        user,
        activeCount,
        lastAssignedAt: lastAssigned ? lastAssigned.assignedAt.getTime() : 0,
      };
    }));

    // 3. Sort logic for Round Robin:
    // Primary: Least active assignments (Load balancing)
    // Secondary: Longest time since last assignment
    workloadStats.sort((a, b) => {
      if (a.activeCount !== b.activeCount) {
        return a.activeCount - b.activeCount;
      }
      return a.lastAssignedAt - b.lastAssignedAt;
    });

    const selectedEmployee = workloadStats[0].user;

    // 4. Create Assignment record
    const assignment = new Assignment({
      orderId,
      taskId,
      assignedTo: selectedEmployee._id,
      assignedBy,
      roleType,
      status: 'ASSIGNED'
    });

    await assignment.save();

    return assignment;

  } catch (error) {
    console.error('Round Robin Assignment Error:', error);
    throw error;
  }
};
