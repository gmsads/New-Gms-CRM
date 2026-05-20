const Prospect = require('../../domains/sales/prospects/prospect.model');
const auditWorkflow = require('./auditWorkflow.service');

class ProspectWorkflowService {
  async createProspect(data, creatorId, reqContext = {}) {
    const prospect = new Prospect({
      ...data,
      createdBy: creatorId,
      updatedBy: creatorId
    });

    await prospect.save();

    await auditWorkflow.log({
      action: 'PROSPECT_CREATED',
      performedBy: creatorId,
      targetModel: 'Prospect',
      targetId: prospect._id,
      newValue: prospect,
      ipAddress: reqContext.ipAddress,
      userAgent: reqContext.userAgent,
      device: reqContext.device
    });

    return prospect;
  }

  async updateProspect(id, data, actorId, reqContext = {}) {
    const oldProspect = await Prospect.findById(id).lean();
    if (!oldProspect || oldProspect.softDelete?.isDeleted) throw new Error('Prospect not found');

    const prospect = await Prospect.findByIdAndUpdate(
      id,
      { ...data, updatedBy: actorId },
      { new: true, runValidators: true }
    ).lean();

    await auditWorkflow.trackUpdate('Prospect', id, actorId, oldProspect, prospect, reqContext);

    return prospect;
  }

  async updateStage(id, stage, actorId, reqContext = {}) {
    const oldProspect = await Prospect.findById(id).lean();
    if (!oldProspect || oldProspect.softDelete?.isDeleted) throw new Error('Prospect not found');

    const prospect = await Prospect.findByIdAndUpdate(
      id,
      { stage, lastInteraction: new Date(), updatedBy: actorId },
      { new: true }
    ).lean();

    await auditWorkflow.trackUpdate('Prospect', id, actorId, oldProspect, prospect, reqContext);

    return prospect;
  }

  async addInteraction(id, interactionData, actorId, reqContext = {}) {
    const { type, notes, action } = interactionData;
    const oldProspect = await Prospect.findById(id).lean();
    if (!oldProspect || oldProspect.softDelete?.isDeleted) throw new Error('Prospect not found');

    const update = {
      $push: { 
        interactions: { type, notes, date: new Date() }
      },
      $set: { lastInteraction: new Date(), lastInteractionNote: notes, updatedBy: actorId }
    };
    
    if (action) {
      update.$push.whatsappActions = { action, sentAt: new Date() };
    }

    const prospect = await Prospect.findByIdAndUpdate(id, update, { new: true }).lean();

    await auditWorkflow.log({
      action: 'PROSPECT_INTERACTION_ADDED',
      performedBy: actorId,
      targetModel: 'Prospect',
      targetId: id,
      newValue: { type, notes, action },
      ipAddress: reqContext.ipAddress,
      userAgent: reqContext.userAgent,
      device: reqContext.device
    });

    return prospect;
  }

  async softDeleteProspect(id, actorId, reqContext = {}) {
    const oldProspect = await Prospect.findById(id).lean();
    if (!oldProspect || oldProspect.softDelete?.isDeleted) throw new Error('Prospect not found');

    const prospect = await Prospect.findByIdAndUpdate(
      id,
      {
        softDelete: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: actorId
        },
        updatedBy: actorId
      },
      { new: true }
    ).lean();

    await auditWorkflow.log({
      action: 'PROSPECT_DELETED',
      performedBy: actorId,
      targetModel: 'Prospect',
      targetId: id,
      previousValue: oldProspect,
      newValue: { softDelete: true },
      ipAddress: reqContext.ipAddress,
      userAgent: reqContext.userAgent,
      device: reqContext.device
    });

    return prospect;
  }

  async restoreProspect(id, actorId, reqContext = {}) {
    const oldProspect = await Prospect.findById(id).lean();
    if (!oldProspect || !oldProspect.softDelete?.isDeleted) throw new Error('Prospect not found or not deleted');

    const prospect = await Prospect.findByIdAndUpdate(
      id,
      {
        $unset: { softDelete: "" },
        updatedBy: actorId
      },
      { new: true }
    ).lean();

    await auditWorkflow.log({
      action: 'PROSPECT_RESTORED',
      performedBy: actorId,
      targetModel: 'Prospect',
      targetId: id,
      newValue: { softDelete: false },
      ipAddress: reqContext.ipAddress,
      userAgent: reqContext.userAgent,
      device: reqContext.device
    });

    return prospect;
  }
}

module.exports = new ProspectWorkflowService();
