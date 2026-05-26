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

  async updateStage(id, updateData, actorId, reqContext = {}) {
    const oldProspect = await Prospect.findById(id).lean();
    if (!oldProspect || oldProspect.softDelete?.isDeleted) throw new Error('Prospect not found');

    const data = typeof updateData === 'string' ? { stage: updateData } : (updateData || {});
    const updateFields = {
      updatedBy: actorId,
      lastInteraction: new Date()
    };

    if (data.stage) {
      updateFields.stage = data.stage;
    }

    if (data.status) {
      updateFields.status = data.status;
      if (data.status === 'Canceled') {
        updateFields.stage = 'Lost';
      } else if (data.status === 'Sale Confirmed' || data.status === 'Order Confirmed') {
        updateFields.stage = 'Won';
      }
    }

    if (data.date) {
      updateFields.nextFollowUpDate = new Date(data.date);
    } else if (['Canceled', 'Sale Confirmed', 'Order Confirmed'].includes(data.status)) {
      updateFields.nextFollowUpDate = null;
    }

    if (data.reason) {
      updateFields.cancelReason = data.reason;
    }

    const notesStr = data.remark || (data.status === 'Canceled' ? `Prospect Canceled: ${data.reason || ''}` : data.status === 'Sale Confirmed' ? `Sale Confirmed - Order ID: ${data.orderId || ''}` : '');
    if (notesStr) {
      updateFields.lastInteractionNote = notesStr;
    }

    const updateQuery = { $set: updateFields };

    if (notesStr) {
      updateQuery.$push = {
        interactions: {
          type: data.status || 'Follow-up',
          date: new Date(),
          notes: notesStr
        }
      };
    }

    if (data.orderId) {
      const Order = require('../../domains/orders/order.model');
      const orderDoc = await Order.findOne({ orderNumber: data.orderId });
      if (orderDoc) {
        updateFields.linkedOrderId = orderDoc._id;
      }
    }

    const prospect = await Prospect.findByIdAndUpdate(
      id,
      updateQuery,
      { new: true }
    ).lean();

    if (data.status === 'Sale Confirmed' || data.status === 'Order Confirmed') {
      const appointmentService = require('../appointment.service');
      await appointmentService.cancelActiveAppointmentsForProspect(id, actorId);
    }

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
