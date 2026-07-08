const Compensation = require('../../domains/hr/compensation.model');
const Payslip = require('../../domains/hr/payslip.model');

// --- Compensation ---
exports.getCompensations = async (req, res) => {
  try {
    const compensations = await Compensation.find().populate('employee', 'name email role department');
    res.json(compensations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCompensation = async (req, res) => {
  try {
    const compensation = new Compensation(req.body);
    await compensation.save();
    res.status(201).json(compensation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCompensation = async (req, res) => {
  try {
    const compensation = await Compensation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!compensation) return res.status(404).json({ message: 'Compensation not found' });
    res.json(compensation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCompensation = async (req, res) => {
  try {
    const compensation = await Compensation.findByIdAndDelete(req.params.id);
    if (!compensation) return res.status(404).json({ message: 'Compensation not found' });
    res.json({ message: 'Compensation deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Payslips ---
exports.getPayslips = async (req, res) => {
  try {
    const payslips = await Payslip.find().populate('employee', 'name email role department');
    res.json(payslips);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createPayslip = async (req, res) => {
  try {
    const payslip = new Payslip({ ...req.body, generatedBy: req.user._id });
    await payslip.save();
    res.status(201).json(payslip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updatePayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payslip) return res.status(404).json({ message: 'Payslip not found' });
    res.json(payslip);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deletePayslip = async (req, res) => {
  try {
    const payslip = await Payslip.findByIdAndDelete(req.params.id);
    if (!payslip) return res.status(404).json({ message: 'Payslip not found' });
    res.json({ message: 'Payslip deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
