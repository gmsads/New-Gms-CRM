const Appointment = require('../../domains/sales/appointments/appointment.model');
const AppointmentTimeline = require('../../domains/sales/appointments/appointmentTimeline.model');
const notificationWorkflow = require('./notificationWorkflow.service');
const auditWorkflow = require('./auditWorkflow.service');
const eventBus = require('./eventBus');

class EscalationWorkflowService {
  async checkOverdueAppointments() {
    const now = new Date();
    
    const h24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const h48 = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const h72 = new Date(now.getTime() - 72 * 60 * 60 * 1000);

    // Level 1: > 24 hours overdue
    const level1Appointments = await Appointment.find({
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
      date: { $lte: h24, $gt: h48 },
      escalationLevel: 0
    });

    for (const appt of level1Appointments) {
      await this.escalateAppointment(appt, 1, 'Overdue by 24 hours');
    }

    // Level 2: > 48 hours overdue
    const level2Appointments = await Appointment.find({
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
      date: { $lte: h48, $gt: h72 },
      escalationLevel: { $lt: 2 }
    });

    for (const appt of level2Appointments) {
      await this.escalateAppointment(appt, 2, 'Overdue by 48 hours');
    }

    // Level 3: > 72 hours overdue (CRITICAL)
    const level3Appointments = await Appointment.find({
      status: { $in: ['SCHEDULED', 'IN_PROGRESS'] },
      date: { $lte: h72 },
      escalationLevel: { $lt: 3 }
    });

    for (const appt of level3Appointments) {
      await this.escalateAppointment(appt, 3, 'Overdue by 72 hours - Critical');
    }

    return {
      level1Count: level1Appointments.length,
      level2Count: level2Appointments.length,
      level3Count: level3Appointments.length
    };
  }

  async escalateAppointment(appointment, level, reason) {
    const previousState = { escalationLevel: appointment.escalationLevel, priority: appointment.priority };
    appointment.escalationLevel = level;
    appointment.isOverdue = true;
    appointment.lastEscalatedAt = new Date();
    
    if (level === 3) {
      appointment.priority = 'CRITICAL'; // Dashboard Priority Update
    }

    await appointment.save();

    await AppointmentTimeline.create({
      appointmentId: appointment._id,
      actor: appointment.assignedTo || appointment.createdBy,
      action: 'ESCALATED',
      previousState,
      newState: { escalationLevel: level, priority: appointment.priority, reason }
    });

    await auditWorkflow.log({
      action: 'APPOINTMENT_ESCALATED',
      performedBy: appointment.assignedTo || appointment.createdBy,
      targetModel: 'Appointment',
      targetId: appointment._id,
      newValue: { escalationLevel: level, reason }
    });

    // Emit Event for decouple
    eventBus.emit('APPOINTMENT_ESCALATED', { appointment, level, reason });

    // Notify logic
    if (level === 1 && appointment.managerId) {
      await notificationWorkflow.sendNotification({
        recipient: appointment.managerId,
        sender: appointment.assignedTo || appointment.createdBy,
        type: 'Alert',
        title: 'Appointment Escalation - Level 1',
        message: `Appointment for ${appointment.businessName} is overdue. Reason: ${reason}`,
        link: `/appointments/${appointment._id}`
      });
    } else if (level === 2) {
      await notificationWorkflow.broadcastToRole('ADMIN', {
        sender: appointment.assignedTo || appointment.createdBy,
        type: 'Alert',
        title: 'Appointment Escalation - Level 2 (CRITICAL)',
        message: `Appointment for ${appointment.businessName} is severely overdue. Reason: ${reason}`,
        link: `/appointments/${appointment._id}`
      });
    } else if (level === 3) {
      await notificationWorkflow.broadcastToRole('ADMIN', {
        sender: appointment.assignedTo || appointment.createdBy,
        type: 'Alert',
        title: 'Appointment Escalation - Level 3 (URGENT)',
        message: `Appointment for ${appointment.businessName} is 72h overdue and marked CRITICAL. Immediate action required.`,
        link: `/appointments/${appointment._id}`
      });
    }
  }

  async checkFollowupReminders() {
    const Followup = require('../../domains/sales/followups/followup.model');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pendingFollowups = await Followup.find({
      status: 'Scheduled',
      scheduledAt: { $gte: today, $lt: tomorrow }
    });

    for (const f of pendingFollowups) {
      if (f.performedBy) {
        await notificationWorkflow.sendNotification({
          recipient: f.performedBy,
          sender: f.performedBy,
          type: 'Reminder',
          title: 'Follow-up Reminder',
          message: `You have a follow-up scheduled today.`,
          link: `/followups`
        });
      }
    }
  }
}

module.exports = new EscalationWorkflowService();
