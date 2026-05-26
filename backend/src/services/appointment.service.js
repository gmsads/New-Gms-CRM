const appointmentRepo = require('../repositories/appointment.repository');
const Prospect = require('../domains/sales/prospects/prospect.model');
const Notification = require('../domains/notifications/notification.model');
const AppointmentRemark = require('../domains/sales/appointments/appointmentRemark.model');
const AppointmentTimeline = require('../domains/sales/appointments/appointmentTimeline.model');

class AppointmentService {
  async createAppointment(data, creatorId) {
    const { prospectId, date, time, venue, meetingType, priority, managerId } = data;

    const prospect = await Prospect.findById(prospectId);
    if (!prospect) throw new Error('Prospect not found');

    const appointment = await appointmentRepo.create({
      prospect: prospect._id,
      createdBy: creatorId,
      managerId,
      businessName: prospect.company,
      contactPerson: prospect.name,
      phone: prospect.phone,
      date,
      time,
      venue,
      meetingType: meetingType || 'Office Meeting',
      priority: priority || 'Medium',
      status: 'PENDING'
    });

    await AppointmentTimeline.create({
      appointmentId: appointment._id,
      actor: creatorId,
      action: 'CREATED',
      newState: { status: 'PENDING' }
    });

    // Side effect: update prospect stage
    await Prospect.findByIdAndUpdate(prospectId, { 
      stage: 'Appointment',
      $push: { 
        interactions: { 
          type: 'Meeting', 
          date: new Date(), 
          notes: `Appointment scheduled for ${new Date(date).toLocaleDateString()} at ${time}` 
        } 
      }
    });

    return appointment;
  }

  async listAppointments(user, filter = {}) {
    const userId = user._id;
    const query = { ...filter };
    
    if (user.role === 'SALES_EXEC' || user.role === 'SR_SALES_EXEC') {
      query.$or = [{ createdBy: userId }, { assignedTo: userId }];
    } else if (user.role === 'FIELD_EXEC' || user.role === 'AGENT') {
      query.assignedTo = userId;
    } else if (user.role === 'SALES_MANAGER' || user.role === 'SR_SALES_MANAGER') {
      // Temporary: allow manager to see all appointments until team assignment is built
      // query.$or = [{ createdBy: userId }, { managerId: userId }];
    }

    return await appointmentRepo.findWithDetails(query);
  }

  async assignAppointment(id, assignedTo, assignerId) {
    const oldAppt = await appointmentRepo.findById(id);
    if (!oldAppt) throw new Error('Appointment not found');

    const appointment = await appointmentRepo.updateById(id, { 
      assignedTo, 
      assignedAt: new Date(), 
      status: 'SCHEDULED' 
    });

    await AppointmentTimeline.create({
      appointmentId: appointment._id,
      actor: assignerId,
      action: 'ASSIGNED',
      previousState: { status: oldAppt.status, assignedTo: oldAppt.assignedTo },
      newState: { status: 'SCHEDULED', assignedTo }
    });
    
    // Side effect: notification
    await Notification.create({
      recipient: assignedTo,
      sender: assignerId,
      type: 'Appointment',
      title: 'New Appointment Assigned',
      message: `You have been assigned to a meeting with ${appointment.businessName} on ${new Date(appointment.date).toLocaleDateString()} at ${appointment.time}.`,
      link: '/appointments'
    });

    return appointment;
  }

  async updateStatus(id, newStatus, actorId) {
    const oldAppt = await appointmentRepo.findById(id);
    if (!oldAppt) throw new Error('Appointment not found');

    const appointment = await appointmentRepo.updateById(id, { status: newStatus });

    await AppointmentTimeline.create({
      appointmentId: appointment._id,
      actor: actorId,
      action: 'STATUS_CHANGED',
      previousState: { status: oldAppt.status },
      newState: { status: newStatus }
    });

    return appointment;
  }

  async addRemark(id, data, actorId) {
    const { outcomeType, notes, nextActionDate } = data;
    const appointment = await appointmentRepo.findById(id);
    if (!appointment) throw new Error('Appointment not found');

    const remark = await AppointmentRemark.create({
      appointmentId: appointment._id,
      addedBy: actorId,
      outcomeType,
      notes,
      nextActionDate
    });

    let newStatus = appointment.status;
    if (outcomeType === 'Need Follow-up' || outcomeType === 'Interested') newStatus = 'FOLLOWUP_REQUIRED';
    if (outcomeType === 'Sale Confirmed') newStatus = 'SALE_CONFIRMED';
    if (outcomeType === 'Not Interested' || outcomeType === 'Competitor Chosen') newStatus = 'LOST';
    if (outcomeType === 'Quotation Requested') newStatus = 'FOLLOWUP_REQUIRED'; // Or IN_PROGRESS

    if (newStatus !== appointment.status) {
      await this.updateStatus(id, newStatus, actorId);
    }

    await AppointmentTimeline.create({
      appointmentId: appointment._id,
      actor: actorId,
      action: 'REMARK_ADDED',
      newState: { outcomeType, notes }
    });

    await Prospect.findByIdAndUpdate(appointment.prospect, { 
      lastInteraction: new Date(),
      lastInteractionNote: `Meeting Outcome: ${outcomeType} - ${notes}`
    });

    return remark;
  }

  async cancelActiveAppointmentsForProspect(prospectId, actorId) {
    const Appointment = require('../domains/sales/appointments/appointment.model');
    const AppointmentTimeline = require('../domains/sales/appointments/appointmentTimeline.model');
    
    const activeAppts = await Appointment.find({
      prospect: prospectId,
      status: { $in: ['PENDING', 'SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS', 'FOLLOWUP_REQUIRED'] }
    });
    
    for (const appt of activeAppts) {
      const prevStatus = appt.status;
      
      await Appointment.findByIdAndUpdate(appt._id, {
        status: 'SALE_CONFIRMED',
        remark: (appt.remark ? appt.remark + '\n' : '') + 'Automated: Sale confirmed, appointment canceled.'
      });
      
      await AppointmentTimeline.create({
        appointmentId: appt._id,
        actor: actorId || appt.createdBy,
        action: 'STATUS_CHANGED',
        previousState: { status: prevStatus },
        newState: { status: 'SALE_CONFIRMED' }
      });
    }
  }

  async getTimeline(appointmentId) {
    return await AppointmentTimeline.find({ appointmentId })
      .populate('actor', 'name role')
      .sort({ createdAt: 1 });
  }

  async getStats() {
    const pendingCount = await appointmentRepo.countDocuments({ status: 'PENDING' });
    return { pendingCount };
  }
}

module.exports = new AppointmentService();
