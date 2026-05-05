const Visit = require('../../domains/field/visits/visit.model');

exports.list = async (req, res) => {
  try {
    const { assignedTo, status, date } = req.query;
    const filter = {};
    if (assignedTo) filter.assignedTo = assignedTo;
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      filter.scheduledDate = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }
    const visits = await Visit.find(filter)
      .populate('assignedTo', 'name')
      .populate('relatedClient', 'name')
      .sort({ scheduledDate: 1 })
      .lean();
    res.json({ success: true, data: visits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const visit = new Visit(req.body);
    await visit.save();
    res.status(201).json({ success: true, data: visit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const { gpsLat, gpsLng, photo } = req.body;
    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      { status: 'In Progress', checkIn: { time: new Date(), gpsLat, gpsLng, photo } },
      { new: true }
    );
    if (!visit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: visit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const { gpsLat, gpsLng, photo, completionNotes, mediaUploads } = req.body;
    const visit = await Visit.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Completed',
        checkOut: { time: new Date(), gpsLat, gpsLng, photo },
        completionNotes,
        ...(mediaUploads && { mediaUploads }),
      },
      { new: true }
    );
    if (!visit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: visit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const visit = await Visit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!visit) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: visit });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
