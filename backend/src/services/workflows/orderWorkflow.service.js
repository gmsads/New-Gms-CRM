const Order = require('../../domains/orders/order.model');
const Prospect = require('../../domains/sales/prospects/prospect.model');
const OrderApproval = require('../../domains/approvals/approval.model');
const auditWorkflow = require('./auditWorkflow.service');
const { ORDER_TRANSITIONS, validateOrderTransition } = require('../../workflows/order.workflow'); // We can reuse logic or copy it.

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
      
      const eventBus = require('./eventBus');
      eventBus.emit('ORDER_CONFIRMED', { order, user, reqContext });

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

      if (!['Draft', 'Pending_Approval'].includes(oldOrder.status)) {
        throw new Error('Only Draft or Pending orders can be edited.');
      }

      // Concurrency check inside transaction
      if (data.__v !== undefined && data.__v !== oldOrder.__v) {
        throw { name: 'VersionError' };
      }

      const order = await Order.findByIdAndUpdate(orderId, data, { new: true, session });
      order.addTimelineEvent('Order Updated', `Updated by ${user.name}`, user);
      await order.save({ session });

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
}

module.exports = new OrderWorkflowService();
