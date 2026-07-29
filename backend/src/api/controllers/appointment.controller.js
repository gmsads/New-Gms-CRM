const appointmentWorkflow = require('../../services/workflows/appointmentWorkflow.service');

const getReqContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  device: req.headers['user-agent']
});

// ── POST /api/appointments ───────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const appointment = await appointmentWorkflow.createAppointment(req.body, req.user, getReqContext(req));
    res.status(201).json({ success: true, data: appointment });
  } catch (err) {
    if (err.code === 'DUPLICATE_APPOINTMENT') {
      return res.status(409).json({ success: false, message: err.message, existingAppointment: err.existingAppointment });
    }
    res.status(err.message === 'Prospect not found' ? 404 : 500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ── GET /api/appointments ────────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const appointments = await appointmentWorkflow.listAppointments(req.user, req.query);
    res.json({ success: true, data: appointments });
  } catch (err) {
    require('fs').appendFileSync('error.log', new Date().toISOString() + ' - ' + err.stack + '\n');
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PATCH /api/appointments/:id/assign ────────────────────────────────────────
exports.assign = async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const appointment = await appointmentWorkflow.assignAppointment(req.params.id, assignedTo, req.user._id, getReqContext(req));
    res.json({ success: true, data: appointment });
  } catch (err) {
    require('fs').appendFileSync('error.log', new Date().toISOString() + ' - ASSIGN - ' + err.stack + '\n');
    res.status(err.message === 'Appointment not found' ? 404 : (err.message.includes('Access denied') ? 403 : 500)).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ── PATCH /api/appointments/:id/reschedule ────────────────────────────────────
exports.reschedule = async (req, res) => {
  try {
    const appointment = await appointmentWorkflow.rescheduleAppointment(req.params.id, req.body, req.user._id, getReqContext(req));
    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(err.message === 'Appointment not found' ? 404 : 500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ── PATCH /api/appointments/:id/status ────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await appointmentWorkflow.updateStatus(req.params.id, status, req.user, req.body, getReqContext(req));
    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(err.message === 'Appointment not found' ? 404 : (err.message.includes('Access denied') || err.message.includes('Invalid transition') ? 403 : 500)).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ── POST /api/appointments/:id/remarks ────────────────────────────────────────
exports.addRemark = async (req, res) => {
  try {
    const remark = await appointmentWorkflow.addRemark(req.params.id, req.body, req.user, getReqContext(req));
    res.json({ success: true, data: remark });
  } catch (err) {
    res.status(err.message === 'Appointment not found' ? 404 : (err.message.includes('Access denied') || err.message.includes('Invalid transition') ? 403 : 500)).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ── POST /api/appointments/:id/link-order ────────────────────────────────────────
exports.linkOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const appointment = await appointmentWorkflow.linkOrder(req.params.id, orderId, req.user, getReqContext(req));
    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(err.message === 'Appointment not found' ? 404 : 500).json({ 
      success: false, 
      message: err.message 
    });
  }
};

// ── GET /api/appointments/:id/timeline ────────────────────────────────────────
exports.getTimeline = async (req, res) => {
  try {
    const timeline = await appointmentWorkflow.getTimeline(req.params.id);
    res.json({ success: true, data: timeline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/appointments/stats ───────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const stats = await appointmentWorkflow.getStats(req.user);
    res.json({ success: true, ...stats });
  } catch (err) {
    require('fs').appendFileSync('error.log', new Date().toISOString() + ' - STATS - ' + err.stack + '\n');
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/appointments/workload ─────────────────────────────────────────────
exports.getWorkload = async (req, res) => {
  try {
    const workload = await appointmentWorkflow.getWorkload(req.user);
    res.json({ success: true, data: workload });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/appointments/:id/link-order ───────────────────────────────────────
exports.linkOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId is required' });
    }
    const appointment = await appointmentWorkflow.linkOrder(req.params.id, orderId, req.user);
    res.json({ success: true, message: 'Order linked successfully', appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
