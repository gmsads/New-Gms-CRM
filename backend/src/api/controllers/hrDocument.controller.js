const HRDocument = require('../../domains/hr/hrDocument.model');

exports.getDocuments = async (req, res) => {
  try {
    const documents = await HRDocument.find().populate('employee', 'name email role department').populate('uploadedBy', 'name');
    res.json(documents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createDocument = async (req, res) => {
  try {
    const document = new HRDocument({ ...req.body, uploadedBy: req.user._id });
    await document.save();
    res.status(201).json(document);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const document = await HRDocument.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json(document);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await HRDocument.findByIdAndDelete(req.params.id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
