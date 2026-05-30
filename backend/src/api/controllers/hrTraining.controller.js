const Training = require('../../domains/hr/training.model');

exports.getTrainings = async (req, res) => {
  try {
    const trainings = await Training.find().populate('participants', 'name email role department').populate('instructor', 'name');
    res.json(trainings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createTraining = async (req, res) => {
  try {
    const training = new Training({ ...req.body, createdBy: req.user._id });
    await training.save();
    res.status(201).json(training);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!training) return res.status(404).json({ message: 'Training not found' });
    res.json(training);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndDelete(req.params.id);
    if (!training) return res.status(404).json({ message: 'Training not found' });
    res.json({ message: 'Training deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
