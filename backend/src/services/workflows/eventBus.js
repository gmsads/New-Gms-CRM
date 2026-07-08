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

    // Register other events as needed...
  }
}

// Export a singleton
module.exports = new DomainEventBus();
