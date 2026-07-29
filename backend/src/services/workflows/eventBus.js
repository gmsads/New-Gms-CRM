const EventEmitter = require('events');
const notificationWorkflow = require('./notificationWorkflow.service');
// other handlers can be imported here or registered dynamically

class DomainEventBus extends EventEmitter {
  constructor() {
    super();
    this.registerCoreHandlers();
  }

  registerCoreHandlers() {
    this.on('APPOINTMENT_CREATED', async ({ appointment, creatorId, reqContext }) => {
      // Logic for side-effects when an appointment is created
      console.log(`[EVENT] APPOINTMENT_CREATED for ${appointment.businessName}`);
      if (appointment.managerId) {
        await notificationWorkflow.sendNotification({
          recipient: appointment.managerId,
          sender: creatorId,
          type: 'Appointment',
          title: 'New Appointment Scheduled',
          message: `A new appointment has been scheduled for ${appointment.businessName}.`,
          link: `/appointments/${appointment._id}`
        });
      }
    });

    this.on('APPOINTMENT_ESCALATED', async ({ appointment, level, reason, reqContext }) => {
      console.log(`[EVENT] APPOINTMENT_ESCALATED level ${level} for ${appointment.businessName}`);
      // Usually the escalation workflow emits this, but handlers can be added here
    });

    this.on('ORDER_CONFIRMED', async ({ order, user, reqContext }) => {
      console.log(`[EVENT] ORDER_CONFIRMED for ${order.orderNumber}`);
      // Notify managers
      await notificationWorkflow.broadcastToRole('SALES_MANAGER', {
        sender: user._id,
        type: 'Order',
        title: 'New Order Confirmed',
        message: `Order #${order.orderNumber} has been confirmed.`,
        link: `/orders/${order._id}`
      });
    });

    this.on('FOLLOWUP_CREATED', async ({ followup, creatorId, reqContext }) => {
      console.log(`[EVENT] FOLLOWUP_CREATED for prospect ${followup.prospect}`);
    });

    this.on('SALE_CLOSED_EVENT', async ({ appointment, actorId, reqContext }) => {
      console.log(`[EVENT] SALE_CLOSED_EVENT for appointment ${appointment._id}`);
      // Notify the Sales Executive who created the appointment
      if (appointment.createdBy) {
        await notificationWorkflow.sendNotification({
          recipient: appointment.createdBy,
          sender: actorId,
          type: 'Appointment',
          title: 'Pending Sale Conversion',
          message: `Appointment #${appointment._id} (${appointment.businessName}) has been converted into a Sale. Please create the Order.`,
          link: `/appointments/${appointment._id}`
        });
      }
    });

    this.on('APPOINTMENT_CANCELLED_EVENT', async ({ appointment, actorId, reqContext }) => {
      console.log(`[EVENT] APPOINTMENT_CANCELLED_EVENT for appointment ${appointment._id}`);
      // Notify higher management
      const rolesToNotify = ['SALES_MANAGER', 'BRANCH_HEAD', 'ADMIN', 'COO', 'CEO', 'MD_CEO'];
      for (const role of rolesToNotify) {
        await notificationWorkflow.broadcastToRole(role, {
          sender: actorId,
          type: 'Appointment',
          title: 'Appointment Cancelled',
          message: `Appointment #${appointment._id} has been cancelled.`,
          link: `/appointments/${appointment._id}`
        });
      }
    });

    this.on('APPOINTMENT_ORDER_LINKED', async ({ appointment, actorId, reqContext }) => {
      console.log(`[EVENT] APPOINTMENT_ORDER_LINKED for appointment ${appointment._id}`);
      // Can perform any cleanup here if needed, like resolving the pending notification
    });

    // Register other events as needed...
  }
}

// Export a singleton
module.exports = new DomainEventBus();
