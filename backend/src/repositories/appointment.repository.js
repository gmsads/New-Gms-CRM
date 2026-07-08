const BaseRepository = require('./base.repository');
const Appointment = require('../domains/sales/appointments/appointment.model');

class AppointmentRepository extends BaseRepository {
  constructor() {
    super(Appointment);
  }

  async findWithDetails(filter) {
    return await this.find(filter, {
      populate: [
        { path: 'createdBy', select: 'name' },
        { path: 'assignedTo', select: 'name role' },
        { path: 'prospect', select: 'name company phone status requirement' }
      ],
      sort: { date: 1, time: 1 },
      lean: true
    });
  }
}

module.exports = new AppointmentRepository();
