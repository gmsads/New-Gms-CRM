const Appointment = require('../../domains/sales/appointments/appointment.model');
const Prospect = require('../../domains/sales/prospects/prospect.model');

// ── POST /api/appointments ───────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { prospectId, date, time, venue } = req.body;

    const prospect = await Prospect.findById(prospectId);
    if (!prospect) {
      return res.status(404).json({ success: false, message: 'Prospect not found' });
    }

    const appointment = new Appointment({
      prospect: prospect._id,
      createdBy: req.user._id,
      businessName: prospect.company,
      contactPerson: prospect.name,
      phone: prospect.phone,
      date,
      time,
      venue
    });

    await appointment.save();
    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/appointments ────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const filter = {};
    
    // If Sales Exec, they see their created appointments
    if (req.user.role === 'SALES_EXEC') {
      filter.$or = [{ createdBy: req.user._id }, { assignedTo: req.user._id }];
    } 
    // If Field Exec or other assigned roles, they see their assignments
    else if (req.user.role === 'FIELD_EXEC' || req.user.role === 'AGENT') {
      filter.assignedTo = req.user._id;
    }
    // Admin, MD_CEO, SALES_MANAGER see all

    const appointments = await Appointment.find(filter)
      .populate('createdBy', 'name')
      .populate('assignedTo', 'name role')
      .populate('prospect', 'name company phone status requirement')
      .sort({ date: 1, time: 1 })
      .lean();

    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/appointments/:id/assign ────────────────────────────────────────
// Done by Sales Manager
exports.assign = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { assignedTo, assignedAt: new Date(), status: 'Scheduled' },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
    
    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/appointments/:id/remark ────────────────────────────────────────
// Done by Assigned Person
exports.updateRemark = async (req, res) => {
  try {
    const { remark, prospectStatus } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });

    appointment.remark = remark;
    appointment.remarkUpdatedAt = new Date();
    
    // If they marked it completed or canceled
    if (prospectStatus === 'Sale Closed' || prospectStatus === 'Canceled') {
      appointment.status = 'Completed'; // or Canceled
    } else {
      appointment.status = 'Completed'; 
    }
    await appointment.save();

    // Optionally update the prospect status
    if (prospectStatus) {
      await Prospect.findByIdAndUpdate(appointment.prospect, { 
        status: prospectStatus,
        lastInteraction: new Date(),
        lastInteractionNote: `Appointment Remark: ${remark}`
      });
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
