const User = require('../../domains/users/user.model');
const JobOpening = require('../../domains/hr/jobOpening.model');
const Candidate = require('../../domains/hr/candidate.model');
const Leave = require('../../domains/hr/leave.model');

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalEmployees, openJobs, newCandidates, pendingLeaves] = await Promise.all([
      User.countDocuments({ status: 'ACTIVE' }),
      JobOpening.countDocuments({ status: 'OPEN' }),
      Candidate.countDocuments({ status: 'APPLIED' }),
      Leave.countDocuments({ status: 'PENDING' })
    ]);

    res.json({
      totalEmployees,
      openJobs,
      newCandidates,
      pendingLeaves
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
