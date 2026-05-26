const mongoose = require('mongoose');
const appointmentRepo = require('../../repositories/appointment.repository');
const Prospect = require('../../domains/sales/prospects/prospect.model');
const Notification = require('../../domains/notifications/notification.model');
const AppointmentRemark = require('../../domains/sales/appointments/appointmentRemark.model');
const AppointmentTimeline = require('../../domains/sales/appointments/appointmentTimeline.model');
const auditWorkflow = require('./auditWorkflow.service');
const eventBus = require('./eventBus'); // Will create this next

class AppointmentWorkflowService {
  async createAppointment(data, creatorId, reqContext = {}) {
    const { prospectId, date, time, venue, meetingType, priority, managerId, forceCreate, remark, executiveRemark } = data;

    const prospect = await Prospect.findById(prospectId);
    if (!prospect) throw new Error('Prospect not found');

    if (!forceCreate) {
      const existing = await appointmentRepo.findWithDetails({
        prospect: prospectId,
        status: { $in: ['PENDING', 'SCHEDULED', 'RESCHEDULED'] }
      });
      if (existing && existing.length > 0) {
        const err = new Error('Appointment already exists for this prospect.');
        err.code = 'DUPLICATE_APPOINTMENT';
        err.existingAppointment = existing[0];
        throw err;
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // NOTE: appointmentRepo needs to support sessions. 
      // Using standard model directly here for session support or assume repo accepts session if we pass it? 
      // For safety, let's use the Model directly for transactional creates or pass { session } if repo supports it.
      // I'll assume standard mongoose methods
      const Appointment = require('../../domains/sales/appointments/appointment.model');
      
      const appointment = new Appointment({
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
        status: 'PENDING',
        executiveRemark: executiveRemark || remark || '',
        remark: executiveRemark || remark || ''
      });
      await appointment.save({ session });

      await AppointmentTimeline.create([{
        appointmentId: appointment._id,
        actor: creatorId,
        action: 'CREATED',
        newState: { status: 'PENDING' }
      }], { session });

      await Prospect.findByIdAndUpdate(prospectId, { 
        stage: 'Appointment',
        appointmentCreated: true,
        $push: { 
          interactions: { 
            type: 'Meeting', 
            date: new Date(), 
            notes: `Appointment scheduled for ${new Date(date).toLocaleDateString()} at ${time}` 
          } 
        }
      }, { session });

      await session.commitTransaction();
      session.endSession();

      // Emit events after successful commit
      if (eventBus) eventBus.emit('APPOINTMENT_CREATED', { appointment, creatorId, reqContext });

      await auditWorkflow.log({
        action: 'APPOINTMENT_CREATED',
        performedBy: creatorId,
        targetModel: 'Appointment',
        targetId: appointment._id,
        newValue: appointment,
        ipAddress: reqContext.ipAddress,
        userAgent: reqContext.userAgent,
        device: reqContext.device
      });

      return appointment;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  async listAppointments(user, filter = {}) {
    const userId = user._id;
    const query = { ...filter };
    
    if (user.role === 'SALES_EXEC') {
      query.$or = [{ createdBy: userId }, { assignedTo: userId }];
    } else if (user.role === 'FIELD_EXEC' || user.role === 'AGENT') {
      query.assignedTo = userId;
    } else if (user.role === 'SALES_MANAGER') {
      // Temporary: allow manager to see all appointments until team assignment is built
      // query.$or = [{ createdBy: userId }, { managerId: userId }];
    }

    return await appointmentRepo.findWithDetails(query);
  }

  async assignAppointment(id, assignedTo, assignerId, reqContext = {}) {
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

    await auditWorkflow.trackUpdate('Appointment', appointment._id, assignerId, oldAppt, appointment, reqContext);

    return appointment;
  }

  async updateStatus(id, newStatus, actorId, reqContext = {}) {
    const oldAppt = await appointmentRepo.findById(id);
    if (!oldAppt) throw new Error('Appointment not found');

    // Strict state transition validation can be added here
    const validTransitions = {
      'PENDING': ['SCHEDULED', 'CANCELLED'],
      'SCHEDULED': ['IN_PROGRESS', 'RESCHEDULED', 'CANCELLED'],
      'RESCHEDULED': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['FOLLOWUP_REQUIRED', 'SALE_CONFIRMED', 'LOST', 'CLIENT_NOT_AVAILABLE'],
      'FOLLOWUP_REQUIRED': ['SCHEDULED', 'CANCELLED', 'SALE_CONFIRMED', 'LOST'],
      'CLIENT_NOT_AVAILABLE': ['RESCHEDULED', 'CANCELLED'],
      'CANCELLED': [],
      'SALE_CONFIRMED': [],
      'LOST': []
    };

    if (validTransitions[oldAppt.status] && !validTransitions[oldAppt.status].includes(newStatus)) {
      // allow override if Admin? We would pass user role here.
      // throw new Error(`Invalid transition from ${oldAppt.status} to ${newStatus}`);
    }

    const appointment = await appointmentRepo.updateById(id, { status: newStatus });

    await AppointmentTimeline.create({
      appointmentId: appointment._id,
      actor: actorId,
      action: 'STATUS_CHANGED',
      previousState: { status: oldAppt.status },
      newState: { status: newStatus }
    });

    await auditWorkflow.trackUpdate('Appointment', appointment._id, actorId, oldAppt, appointment, reqContext);

    return appointment;
  }

  async addRemark(id, data, actorId, reqContext = {}) {
    const { outcomeType, notes, nextActionDate, remark, assigneeRemark, status, nextFollowUpDate } = data;
    const oldAppt = await appointmentRepo.findById(id);
    if (!oldAppt) throw new Error('Appointment not found');

    const finalNotes = notes || assigneeRemark || remark || '';
    const finalNextDate = nextActionDate || nextFollowUpDate || null;

    let targetStatus = status || oldAppt.status;
    
    // Map status from select value back to enum format if lowercase/prospect format is used
    if (targetStatus === 'In-progress') targetStatus = 'IN_PROGRESS';
    else if (targetStatus === 'Sale Closed' || targetStatus === 'Sale Confirmed') targetStatus = 'SALE_CONFIRMED';
    else if (targetStatus === 'Canceled') targetStatus = 'LOST';

    let targetOutcome = outcomeType;
    if (!targetOutcome) {
      if (targetStatus === 'SALE_CONFIRMED') targetOutcome = 'Sale Confirmed';
      else if (targetStatus === 'LOST') targetOutcome = 'Not Interested';
      else if (targetStatus === 'CANCELLED') targetOutcome = 'Not Interested';
      else if (targetStatus === 'FOLLOWUP_REQUIRED') targetOutcome = 'Need Follow-up';
      else targetOutcome = 'Interested';
    }

    const newRemark = await AppointmentRemark.create({
      appointmentId: oldAppt._id,
      addedBy: actorId,
      outcomeType: targetOutcome,
      notes: finalNotes,
      nextActionDate: finalNextDate
    });

    // Update appointment document
    const updatedAppointment = await appointmentRepo.updateById(id, {
      status: targetStatus,
      assigneeRemark: finalNotes,
      remark: finalNotes,
      nextFollowUpDate: finalNextDate
    });

    await AppointmentTimeline.create({
      appointmentId: oldAppt._id,
      actor: actorId,
      action: 'STATUS_CHANGED',
      previousState: { status: oldAppt.status, remark: oldAppt.remark, executiveRemark: oldAppt.executiveRemark, assigneeRemark: oldAppt.assigneeRemark, nextFollowUpDate: oldAppt.nextFollowUpDate },
      newState: { status: targetStatus, remark: finalNotes, assigneeRemark: finalNotes, nextFollowUpDate: finalNextDate }
    });

    await Prospect.findByIdAndUpdate(oldAppt.prospect, { 
      lastInteraction: new Date(),
      lastInteractionNote: `Meeting Outcome: ${targetOutcome} - ${finalNotes}`
    });

    await auditWorkflow.log({
      action: 'APPOINTMENT_REMARK_ADDED',
      performedBy: actorId,
      targetModel: 'Appointment',
      targetId: oldAppt._id,
      newValue: { status: targetStatus, remark: finalNotes, nextFollowUpDate: finalNextDate },
      ipAddress: reqContext.ipAddress,
      userAgent: reqContext.userAgent,
      device: reqContext.device
    });

    return newRemark;
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

module.exports = new AppointmentWorkflowService();
