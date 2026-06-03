const Team = require('../domains/hr/team.model');
const mongoose = require('mongoose');

/**
 * Returns an array of accessible user IDs for the given user.
 * - If Admin/MD_CEO/BranchHead/HR: returns null (meaning full access, no filter needed)
 * - If Manager/Team Leader: returns array containing their own ID + all team members' IDs
 * - If standard Executive: returns array containing just their own ID
 * 
 * @param {Object} user - The req.user object
 * @returns {Array<String>|null} Array of string IDs or null for unrestricted
 */
exports.getAccessibleUserIds = async (user) => {
  if (!user || !user.role) return null;

  const fullAccessRoles = ['ADMIN', 'MD_CEO', 'BRANCH_HEAD', 'HR', 'ACCOUNTS', 'IT'];
  if (fullAccessRoles.includes(user.role)) {
    return null; // No filtering needed
  }

  const managerRoles = [
    'SALES_MANAGER', 'SR_SALES_MANAGER', 
    'OPERATION_MANAGER', 'PRODUCTION_MANAGER', 'SERVICE_MANAGER'
  ];
  
  if (managerRoles.includes(user.role) || user.role.includes('EXEC')) {
    // Check if they manage or lead any teams
    const teams = await Team.find({ 
      $or: [
        { manager: user._id },
        { teamLeader: user._id }
      ],
      isActive: true 
    }).lean();
    
    const userIds = [user._id.toString()];
    
    teams.forEach(t => {
      if (t.manager) userIds.push(t.manager.toString());
      if (t.teamLeader) userIds.push(t.teamLeader.toString());
      if (t.members && Array.isArray(t.members)) {
        t.members.forEach(m => userIds.push(m.toString()));
      }
    });
    
    // Deduplicate
    return [...new Set(userIds)];
  }

  // Fallback for anyone else not strictly defined
  return [user._id.toString()];
};
