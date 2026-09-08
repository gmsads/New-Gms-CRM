const Order = require('../../domains/orders/order.model');
const Prospect = require('../../domains/sales/prospects/prospect.model');
const OrderApproval = require('../../domains/approvals/approval.model');
const auditWorkflow = require('./auditWorkflow.service');
const { ORDER_TRANSITIONS, validateOrderTransition } = require('../../workflows/order.workflow'); // We can reuse logic or copy it.
const eventBus = require('../../core/events/eventBus.service');
const domainEvents = require('../../core/events/domainEvents');

const mongoose = require('mongoose');

class OrderWorkflowService {
  async confirmOrder(orderId, user, reqContext = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { confirmOrder } = require('../../workflows/order.workflow');
      const oldOrder = await Order.findById(orderId).session(session).lean();
      
      const order = await confirmOrder(orderId, user, session);
      
      await auditWorkflow.trackUpdate('Order', orderId, user._id, oldOrder, order.toObject(), reqContext);
      
      const eventBusInternal = require('./eventBus');
      eventBusInternal.emit('ORDER_CONFIRMED', { order, user, reqContext });

      await session.commitTransaction();
      session.endSession();
      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async updateOrderStatus(orderId, targetStatus, user, extraData = {}, reqContext = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { updateOrderStatus } = require('../../workflows/order.workflow');
      const oldOrder = await Order.findById(orderId).session(session).lean();

      const order = await updateOrderStatus(orderId, targetStatus, user, extraData, session);

      await auditWorkflow.trackUpdate('Order', orderId, user._id, oldOrder, order.toObject(), reqContext);
      
      await session.commitTransaction();
      session.endSession();
      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  async updateOrder(orderId, data, user, reqContext = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const oldOrder = await Order.findById(orderId).session(session).lean();
      if (!oldOrder) throw new Error('Order not found.');

      const isPrivileged = ['ADMIN', 'MD_CEO', 'CEO', 'COO', 'BRANCH_HEAD'].includes(user.role);
      
      if (!isPrivileged) {
        const ageInMs = new Date() - new Date(oldOrder.createdAt);
        if (ageInMs > 24 * 60 * 60 * 1000) {
          throw new Error('Edit window expired. Only privileged roles can modify orders after 24 hours.');
        }
      }

      if (!['Draft', 'Pending_Approval'].includes(oldOrder.status)) {
        throw new Error('Only Draft or Pending orders can be edited.');
      }

      // --- START EXPLICIT ALLOWLIST ENFORCEMENT ---
      const allowedTopLevel = ['clientSnapshot', 'deliveryDate', '__v'];
      const invalidTopLevel = Object.keys(data).filter(k => !allowedTopLevel.includes(k));
      if (invalidTopLevel.length > 0) {
        throw new Error(`Order update contains unsupported fields.`);
      }

      const sanitizedUpdate = {};

      if (data.clientSnapshot !== undefined) {
        const allowedNested = ['company', 'name', 'phone'];
        const incomingNestedKeys = Object.keys(data.clientSnapshot);
        const invalidNested = incomingNestedKeys.filter(k => !allowedNested.includes(k));
        
        for (const key of invalidNested) {
          const incomingValue = data.clientSnapshot[key];
          const existingValue = oldOrder.clientSnapshot ? oldOrder.clientSnapshot[key] : undefined;
          if (JSON.stringify(incomingValue) !== JSON.stringify(existingValue)) {
            throw new Error(`Order update contains unsupported fields.`);
          }
        }
        
        if (data.clientSnapshot.company !== undefined) sanitizedUpdate['clientSnapshot.company'] = data.clientSnapshot.company;
        if (data.clientSnapshot.name !== undefined) sanitizedUpdate['clientSnapshot.name'] = data.clientSnapshot.name;
        if (data.clientSnapshot.phone !== undefined) sanitizedUpdate['clientSnapshot.phone'] = data.clientSnapshot.phone;
      }

      if (data.deliveryDate !== undefined) {
        sanitizedUpdate.deliveryDate = data.deliveryDate;
      }
      
      // DO NOT copy __v into sanitizedUpdate to prevent forced overwrites.
      // --- END EXPLICIT ALLOWLIST ENFORCEMENT ---

      // Concurrency check inside transaction
      if (data.__v !== undefined && data.__v !== oldOrder.__v) {
        throw { name: 'VersionError' };
      }

      const order = await Order.findByIdAndUpdate(orderId, { $set: sanitizedUpdate }, { new: true, runValidators: true, session });
      order.addTimelineEvent('Order Updated', `Updated by ${user.name}`, user);
      await order.save({ session });

      await auditWorkflow.trackUpdate('Order', orderId, user._id, oldOrder, order.toObject(), reqContext);
      
      await session.commitTransaction();
      session.endSession();

      // Check if delivery date or timeline was updated
      const oldDateStr = oldOrder.deliveryDate ? new Date(oldOrder.deliveryDate).toISOString() : null;
      const newDateStr = order.deliveryDate ? new Date(order.deliveryDate).toISOString() : null;
      if (
        (data.deliveryDate && oldDateStr !== newDateStr) ||
        (data.deliveryTimeline && oldOrder.deliveryTimeline !== order.deliveryTimeline)
      ) {
        eventBus.publish(domainEvents.DELIVERY_DATE_UPDATED, {
          ...order.toObject(),
          oldDeliveryDate: oldOrder.deliveryDate,
          newDeliveryDate: order.deliveryDate,
          oldTimeline: oldOrder.deliveryTimeline,
          newTimeline: order.deliveryTimeline
        }).catch(err => {
          console.error('[OrderWorkflowService] Error publishing DELIVERY_DATE_UPDATED event:', err.message);
        });
      }

      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
  async deleteOrder(orderId, user, reqContext = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new Error('Order not found.');

      const isPrivileged = ['ADMIN', 'MD_CEO', 'CEO', 'COO', 'BRANCH_HEAD'].includes(user.role);
      
      if (!isPrivileged) {
        const ageInMs = new Date() - new Date(order.createdAt);
        if (ageInMs > 24 * 60 * 60 * 1000) {
          throw new Error('Delete window expired. Only privileged roles can delete orders after 24 hours.');
        }
      }

      // Existing workflow safety restriction for deletion: typically we shouldn't delete Completed orders
      if (['Completed', 'Delivered'].includes(order.status)) {
        throw new Error('Cannot delete an order that is already completed or delivered.');
      }

      const oldOrderObj = order.toObject();

      await order.softDelete(user._id);
      
      order.addTimelineEvent('Order Deleted', `Deleted by ${user.name}`, user);
      await order.save({ session });

      await auditWorkflow.trackUpdate('Order', orderId, user._id, oldOrderObj, order.toObject(), reqContext);
      
      await session.commitTransaction();
      session.endSession();

      return order;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

module.exports = new OrderWorkflowService();
