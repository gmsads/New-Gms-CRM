const Followup = require('../../domains/sales/followups/followup.model');
const auditWorkflow = require('./auditWorkflow.service');

class FollowupWorkflowService {
  async createFollowup(data, creatorId, reqContext = {}) {
    const followup = new Followup(data);
    await followup.save();

    await auditWorkflow.log({
      action: 'FOLLOWUP_CREATED',
      performedBy: creatorId,
      targetModel: 'Followup',
      targetId: followup._id,
      newValue: followup.toObject(),
      ipAddress: reqContext.ipAddress,
      userAgent: reqContext.userAgent,
      device: reqContext.device
    });

    return followup;
  }

  async completeFollowup(id, data, actorId, reqContext = {}) {
    const { outcome, notes, nextFollowUpDate, nextAction } = data;
    const oldFollowup = await Followup.findById(id).lean();
    if (!oldFollowup) throw new Error('Followup not found');

    const followup = await Followup.findByIdAndUpdate(
      id,
      { status: 'Completed', completedAt: new Date(), outcome, notes, nextFollowUpDate, nextAction },
      { new: true }
    ).lean();

    await auditWorkflow.trackUpdate('Followup', id, actorId, oldFollowup, followup, reqContext);

    // If there's a nextFollowUpDate, maybe automatically create another follow-up record? 
    // Usually that's done by the client or handled here. 
    if (nextFollowUpDate) {
      await this.createFollowup({
        prospect: followup.prospect,
        scheduledAt: nextFollowUpDate,
        type: nextAction || 'Call',
        status: 'Pending',
        performedBy: followup.performedBy || actorId
      }, actorId, reqContext);
    }

    return followup;
  }
}

module.exports = new FollowupWorkflowService();
