const JobOpening = require('../../domains/hr/jobOpening.model');
const Candidate = require('../../domains/hr/candidate.model');
const Interview = require('../../domains/hr/interview.model');

// --- Job Openings ---
exports.getJobOpenings = async (req, res) => {
  try {
    const jobs = await JobOpening.find().populate('assignedRecruiter', 'name role').populate('createdBy', 'name role');
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createJobOpening = async (req, res) => {
  try {
    const job = new JobOpening({ ...req.body, createdBy: req.user._id });
    await job.save();
    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateJobOpening = async (req, res) => {
  try {
    const job = await JobOpening.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteJobOpening = async (req, res) => {
  try {
    const job = await JobOpening.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ message: 'Job opening deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Candidates ---
exports.getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().populate('appliedPosition');
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCandidate = async (req, res) => {
  try {
    const candidate = new Candidate(req.body);
    await candidate.save();
    res.status(201).json(candidate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json({ message: 'Candidate deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Interviews ---
exports.getInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find().populate('candidate').populate('interviewer', 'name role');
    res.json(interviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createInterview = async (req, res) => {
  try {
    const interview = new Interview({ ...req.body, createdBy: req.user._id });
    await interview.save();
    res.status(201).json(interview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    res.json(interview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteInterview = async (req, res) => {
  try {
    const interview = await Interview.findByIdAndDelete(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    res.json({ message: 'Interview deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
