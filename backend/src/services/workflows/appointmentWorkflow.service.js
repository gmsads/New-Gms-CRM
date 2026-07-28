const mongoose = require('mongoose');
const appointmentRepo = require('../../repositories/appointment.repository');
const Prospect = require('../../domains/sales/prospects/prospect.model');
const Notification = require('../../domains/notifications/notification.model');
const AppointmentRemark = require('../../domains/sales/appointments/appointmentRemark.model');
const AppointmentTimeline = require('../../domains/sales/appointments/appointmentTimeline.model');
const Appointment = require('../../domains/sales/appointments/appointment.model');
const auditWorkflow = require('./auditWorkflow.service');
const eventBus = require('./eventBus'); // Will create this next
const { getAccessibleUserIds } = require('../../utils/team.helper');

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
    const query = { ...filter };
    
    const accessibleIds = await getAccessibleUserIds(user);
    if (accessibleIds) {
      const accessibleStrIds = accessibleIds.map(id => id.toString());
      
      if (filter.createdBy && !accessibleStrIds.includes(filter.createdBy.toString())) {
        query.createdBy = { $in: accessibleIds }; // Enforce intersection
      }
      if (filter.assignedTo && !accessibleStrIds.includes(filter.assignedTo.toString())) {
        query.assignedTo = { $in: accessibleIds }; // Enforce intersection
      }
      if (filter.salesExec && !accessibleStrIds.includes(filter.salesExec.toString())) {
        // Just enforcing some bounds if salesExec is passed manually
        query.$or = [
          { createdBy: { $in: accessibleIds } }, 
          { assignedTo: { $in: accessibleIds } }
        ];
      }

      if (!filter.createdBy && !filter.assignedTo && !filter.salesExec) {
        query.$or = [
          { createdBy: { $in: accessibleIds } }, 
          { assignedTo: { $in: accessibleIds } }
        ];
      }
    }

    return await appointmentRepo.findWithDetails(query);
  }

  async assignAppointment(id, assignedTo, assignerId, reqContext = {}) {
    const oldAppt = await Appointment.findById(id);
    if (!oldAppt) throw new Error('Appointment not found');

    const previousState = { status: oldAppt.status, assignedTo: oldAppt.assignedTo };

    oldAppt.assignedTo = assignedTo;
    oldAppt.assignedAt = new Date();
    oldAppt.status = 'SCHEDULED';
    await oldAppt.save();

    await AppointmentTimeline.create({
      appointmentId: oldAppt._id,
      actor: assignerId,
      action: 'ASSIGNED',
      previousState,
      newState: { status: 'SCHEDULED', assignedTo }
    });
    
    // Side effect: notification
    await Notification.create({
      recipient: assignedTo,
      sender: assignerId,
      type: 'Appointment',
      title: 'New Appointment Assigned',
      message: `You have been assigned to a meeting with ${oldAppt.businessName} on ${new Date(oldAppt.date).toLocaleDateString()} at ${oldAppt.time}.`,
      link: '/appointments'
    });

    if (eventBus) eventBus.emit('APPOINTMENT_ASSIGNED', { appointment: oldAppt, assignerId, reqContext });

    await auditWorkflow.trackUpdate('Appointment', oldAppt._id, assignerId, previousState, oldAppt, reqContext);

    return oldAppt;
  }

  async updateStatus(id, newStatus, user, reqContext = {}) {
    const oldAppt = await Appointment.findById(id);
    if (!oldAppt) throw new Error('Appointment not found');

    if (user.role === 'FIELD_EXEC') {
      if (!oldAppt.assignedTo || oldAppt.assignedTo.toString() !== user._id.toString()) {
        throw new Error('Access denied: You can only update your assigned appointments.');
      }
      const allowedStatuses = ['FOLLOWUP_REQUIRED', 'SALE_CONFIRMED', 'CANCELLED'];
      if (!allowedStatuses.includes(newStatus)) {
        throw new Error(`Access denied: Field Executives can only set status to ${allowedStatuses.join(', ')}`);
      }
    }

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
      if (!['ADMIN', 'MD_CEO'].includes(user.role)) {
        throw new Error(`Invalid transition from ${oldAppt.status} to ${newStatus}`);
      }
    }

    const previousState = { status: oldAppt.status };
    oldAppt.status = newStatus;
    await oldAppt.save();

    await AppointmentTimeline.create({
      appointmentId: oldAppt._id,
      actor: user._id,
      action: 'STATUS_CHANGED',
      previousState,
      newState: { status: newStatus }
    });

    if (eventBus) eventBus.emit('APPOINTMENT_STATUS_CHANGED', { appointment: oldAppt, actorId: user._id, reqContext });

    await Notification.create({
      recipient: oldAppt.createdBy,
      sender: user._id,
      type: 'Appointment',
      title: 'Appointment Status Updated',
      message: `${oldAppt.businessName} appointment status changed to ${newStatus}.`,
      link: '/appointments'
    });

    await auditWorkflow.trackUpdate('Appointment', oldAppt._id, user._id, previousState, oldAppt, reqContext);

    return oldAppt;
  }

  async addRemark(id, data, user, reqContext = {}) {
    const { outcomeType, notes, nextActionDate, remark, assigneeRemark, status, nextFollowUpDate } = data;
    const oldAppt = await Appointment.findById(id);
    if (!oldAppt) throw new Error('Appointment not found');

    if (user.role === 'FIELD_EXEC') {
      if (!oldAppt.assignedTo || oldAppt.assignedTo.toString() !== user._id.toString()) {
        throw new Error('Access denied: You can only update your assigned appointments.');
      }
    }

    const finalNotes = notes || assigneeRemark || remark || '';
    const finalNextDate = nextActionDate || nextFollowUpDate || null;

    let targetStatus = status || oldAppt.status;
    
    // Map status from select value back to enum format if lowercase/prospect format is used
    if (targetStatus === 'In-progress') targetStatus = 'IN_PROGRESS';
    else if (targetStatus === 'Sale Closed' || targetStatus === 'Sale Confirmed') targetStatus = 'SALE_CONFIRMED';
    else if (targetStatus === 'Canceled') targetStatus = 'LOST';
    
    if (user.role === 'FIELD_EXEC') {
      const allowedStatuses = ['FOLLOWUP_REQUIRED', 'SALE_CONFIRMED', 'CANCELLED'];
      if (!allowedStatuses.includes(targetStatus) && targetStatus !== oldAppt.status) {
        throw new Error(`Access denied: Field Executives can only set status to ${allowedStatuses.join(', ')}`);
      }
    }

    let targetOutcome = outcomeType;
    if (!targetOutcome) {
      if (targetStatus === 'SALE_CONFIRMED') targetOutcome = 'Sale Confirmed';
      else if (targetStatus === 'LOST' || targetStatus === 'CANCELLED') targetOutcome = 'Not Interested';
      else if (targetStatus === 'FOLLOWUP_REQUIRED') targetOutcome = 'Need Follow-up';
      else targetOutcome = 'Interested';
    }

    const newRemark = await AppointmentRemark.create({
      appointmentId: oldAppt._id,
      addedBy: user._id,
      outcomeType: targetOutcome,
      notes: finalNotes,
      nextActionDate: finalNextDate
    });

    const previousState = { 
      status: oldAppt.status, 
      remark: oldAppt.remark, 
      assigneeRemark: oldAppt.assigneeRemark, 
      nextFollowUpDate: oldAppt.nextFollowUpDate 
    };

    // Update appointment document
    oldAppt.status = targetStatus;
    oldAppt.assigneeRemark = finalNotes;
    oldAppt.remark = finalNotes;
    oldAppt.nextFollowUpDate = finalNextDate;
    await oldAppt.save();

    await AppointmentTimeline.create({
      appointmentId: oldAppt._id,
      actor: user._id,
      action: 'STATUS_CHANGED',
      previousState,
      newState: { status: targetStatus, remark: finalNotes, assigneeRemark: finalNotes, nextFollowUpDate: finalNextDate }
    });

    if (eventBus) eventBus.emit('APPOINTMENT_REMARK_ADDED', { appointment: oldAppt, actorId: user._id, reqContext });

    await Prospect.findByIdAndUpdate(oldAppt.prospect, { 
      lastInteraction: new Date(),
      lastInteractionNote: `Meeting Outcome: ${targetOutcome} - ${finalNotes}`
    });

    await auditWorkflow.log({
      action: 'APPOINTMENT_REMARK_ADDED',
      performedBy: user._id,
      targetModel: 'Appointment',
      targetId: oldAppt._id,
      newValue: { status: targetStatus, remark: finalNotes, nextFollowUpDate: finalNextDate },
      ipAddress: reqContext.ipAddress,
      userAgent: reqContext.userAgent,
      device: reqContext.device
    });

    return newRemark;
  }

  async rescheduleAppointment(id, data, actorId, reqContext = {}) {
    const { date, time, venue, reason } = data;
    const oldAppt = await Appointment.findById(id);
    if (!oldAppt) throw new Error('Appointment not found');

    const previousState = { 
      date: oldAppt.date, 
      time: oldAppt.time, 
      venue: oldAppt.venue,
      status: oldAppt.status
    };

    oldAppt.date = date || oldAppt.date;
    oldAppt.time = time || oldAppt.time;
    oldAppt.venue = venue || oldAppt.venue;
    oldAppt.status = 'RESCHEDULED';
    await oldAppt.save();

    await AppointmentTimeline.create({
      appointmentId: oldAppt._id,
      actor: actorId,
      action: 'RESCHEDULED',
      previousState,
      newState: { 
        date: oldAppt.date, 
        time: oldAppt.time, 
        venue: oldAppt.venue,
        status: oldAppt.status,
        reason
      }
    });

    if (eventBus) eventBus.emit('APPOINTMENT_RESCHEDULED', { appointment: oldAppt, actorId, reqContext });

    await auditWorkflow.trackUpdate('Appointment', oldAppt._id, actorId, previousState, oldAppt, reqContext);

    return oldAppt;
  }

  async getTimeline(appointmentId) {
    return await AppointmentTimeline.find({ appointmentId })
      .populate('actor', 'name role')
      .sort({ createdAt: 1 });
  }

  async getStats(user) {
    const query = { status: 'PENDING' };
    if (user) {
      const accessibleIds = await getAccessibleUserIds(user);
      if (accessibleIds) {
        query.$or = [
          { createdBy: { $in: accessibleIds } },
          { assignedTo: { $in: accessibleIds } }
        ];
      }
    }
    const pendingCount = await appointmentRepo.countDocuments(query);
    return { pendingCount };
  }
}

module.exports = new AppointmentWorkflowService();
