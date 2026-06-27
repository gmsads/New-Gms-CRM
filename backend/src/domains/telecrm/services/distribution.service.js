const Lead = require('../models/lead.model');
const LeadAssignment = require('../models/leadAssignment.model');
const User = require('../../users/user.model');

/**
 * DistributionService
 * Handles import distribution algorithms, On-Demand batching, and AST rule evaluation.
 */
class DistributionService {
  /**
   * distributeImportedLeads
   * Handles 4 Import Distribution Modes
   */
  async distributeImportedLeads({ leadIds, method, singleUserId, employeeNameMap, actorId }) {
    if (!leadIds || leadIds.length === 0) return { assignedCount: 0, skippedCount: 0 };

    const batchId = `IMPORT-BATCH-${Date.now()}`;
    let assignedCount = 0;

    if (method === 'Keep Unassigned') {
      return { assignedCount: 0, batchId, message: 'Leads kept inside Lead Pool unassigned.' };
    }

    if (method === 'Assign To Single Employee' && singleUserId) {
      await Lead.updateMany(
        { _id: { $in: leadIds } },
        { $set: { assignedEmployee: singleUserId, assignedDate: new Date() } }
      );
      
      const assignmentLogs = leadIds.map(id => ({
        leadId: id,
        assignedTo: singleUserId,
        assignedBy: actorId,
        method: 'Single Employee',
        batchId
      }));
      await LeadAssignment.insertMany(assignmentLogs);
      return { assignedCount: leadIds.length, batchId };
    }

    if (method === 'Round Robin') {
      // Fetch active sales executives
      const agents = await User.find({ 
        role: { $in: ['SALES_EXEC', 'SR_SALES_EXEC', 'FIELD_EXEC', 'AGENT', 'SALES_MANAGER'] },
        status: { $in: ['ACTIVE', 'PROBATION'] }
      }).select('_id').lean();

      if (agents.length === 0) {
        return { assignedCount: 0, message: 'No active sales executives found for Round Robin.' };
      }

      const bulkOps = [];
      const assignmentLogs = [];

      leadIds.forEach((leadId, index) => {
        const agent = agents[index % agents.length];
        bulkOps.push({
          updateOne: {
            filter: { _id: leadId },
            update: { $set: { assignedEmployee: agent._id, assignedDate: new Date() } }
          }
        });
        assignmentLogs.push({
          leadId,
          assignedTo: agent._id,
          assignedBy: actorId,
          method: 'Round Robin',
          batchId
        });
      });

      if (bulkOps.length > 0) {
        await Lead.bulkWrite(bulkOps);
        await LeadAssignment.insertMany(assignmentLogs);
      }
      return { assignedCount: leadIds.length, batchId };
    }

    if (method === 'Employee Mapping' && employeeNameMap) {
      // Fetch all users to match names
      const allUsers = await User.find({ status: { $in: ['ACTIVE', 'PROBATION'] } }).select('_id name email').lean();
      const userLookup = {};
      allUsers.forEach(u => {
        userLookup[u.name.toLowerCase().trim()] = u._id;
        userLookup[u.email.toLowerCase().trim()] = u._id;
      });

      const leads = await Lead.find({ _id: { $in: leadIds } }).select('_id contactPerson companyName email').lean();
      const bulkOps = [];
      const assignmentLogs = [];

      leads.forEach(ld => {
        const mappedName = employeeNameMap[ld._id.toString()];
        if (mappedName) {
          const matchedUserId = userLookup[mappedName.toLowerCase().trim()];
          if (matchedUserId) {
            bulkOps.push({
              updateOne: {
                filter: { _id: ld._id },
                update: { $set: { assignedEmployee: matchedUserId, assignedDate: new Date() } }
              }
            });
            assignmentLogs.push({
              leadId: ld._id,
              assignedTo: matchedUserId,
              assignedBy: actorId,
              method: 'Employee Mapping',
              batchId
            });
            assignedCount++;
          }
        }
      });

      if (bulkOps.length > 0) {
        await Lead.bulkWrite(bulkOps);
        await LeadAssignment.insertMany(assignmentLogs);
      }
      return { assignedCount, skippedCount: leadIds.length - assignedCount, batchId };
    }

    return { assignedCount: 0 };
  }

  /**
   * assignOnDemandBatch
   * Automatically dispenses N unassigned leads to calling agent.
   */
  async assignOnDemandBatch({ userId, batchSize = 10, campaignId = null }) {
    const filter = {
      assignedEmployee: null,
      currentStatus: 'New',
      isDeleted: { $ne: true }
    };
    if (campaignId) filter.campaign = campaignId;

    // Grab next N unassigned leads
    const unassignedLeads = await Lead.find(filter)
      .sort({ createdAt: 1 })
      .limit(batchSize)
      .select('_id leadNumber')
      .lean();

    if (unassignedLeads.length === 0) {
      return { assignedCount: 0, leads: [], message: 'No more unassigned leads available in pool.' };
    }

    const leadIds = unassignedLeads.map(l => l._id);
    const batchId = `ONDEMAND-${userId}-${Date.now()}`;

    await Lead.updateMany(
      { _id: { $in: leadIds } },
      { $set: { assignedEmployee: userId, assignedDate: new Date() } }
    );

    const logs = leadIds.map(id => ({
      leadId: id,
      assignedTo: userId,
      assignedBy: userId,
      method: 'On Demand',
      campaignId,
      batchId
    }));
    await LeadAssignment.insertMany(logs);

    return { assignedCount: leadIds.length, batchId, leads: unassignedLeads };
  }

  /**
   * evaluateRuleAndAssign
   * Evaluates dynamic Rule AST against lead attributes.
   */
  async evaluateRuleAndAssign({ lead, rules, fallbackUserId }) {
    if (!rules || rules.length === 0) return fallbackUserId || null;

    for (const rule of rules) {
      if (!rule.isActive) continue;
      const { conditions, logic, assignToUser } = rule;
      
      let matches = logic === 'AND' ? true : false;

      for (const cond of conditions) {
        const leadVal = (lead[cond.field] || '').toString().toLowerCase().trim();
        const condVal = (cond.value || '').toString().toLowerCase().trim();
        let condMatch = false;

        switch (cond.operator) {
          case 'EQUALS':
            condMatch = leadVal === condVal;
            break;
          case 'NOT_EQUALS':
            condMatch = leadVal !== condVal;
            break;
          case 'CONTAINS':
            condMatch = leadVal.includes(condVal);
            break;
          case 'GREATER_THAN':
            condMatch = parseFloat(leadVal) > parseFloat(condVal);
            break;
          case 'LESS_THAN':
            condMatch = parseFloat(leadVal) < parseFloat(condVal);
            break;
          case 'IN':
            const arr = condVal.split(',').map(s => s.trim());
            condMatch = arr.includes(leadVal);
            break;
        }

        if (logic === 'AND') {
          if (!condMatch) { matches = false; break; }
        } else {
          if (condMatch) { matches = true; break; }
        }
      }

      if (matches && assignToUser) {
        return assignToUser;
      }
    }

    return fallbackUserId || null;
  }
}

module.exports = new DistributionService();
