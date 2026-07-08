const ExitProcess = require('../../domains/hr/exitProcess.model');

exports.getExitProcesses = async (req, res) => {
  try {
    const exits = await ExitProcess.find().populate('employee', 'name email role department').populate('processedBy', 'name');
    res.json(exits);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createExitProcess = async (req, res) => {
  try {
    const exit = new ExitProcess({ ...req.body, processedBy: req.user._id });
    await exit.save();
    res.status(201).json(exit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateExitProcess = async (req, res) => {
  try {
    const exit = await ExitProcess.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exit) return res.status(404).json({ message: 'Exit process not found' });
    res.json(exit);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteExitProcess = async (req, res) => {
  try {
    const exit = await ExitProcess.findByIdAndDelete(req.params.id);
    if (!exit) return res.status(404).json({ message: 'Exit process not found' });
    res.json({ message: 'Exit process deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
