const express = require('express');
const router = express.Router();
const c = require('../controllers/hrRecruitment.controller');
const { protect, hrOnly } = require('../../guards/auth.guard');

router.use(protect);
router.use(hrOnly);

// Job Openings
router.get('/jobs', c.getJobOpenings);
router.post('/jobs', c.createJobOpening);
router.put('/jobs/:id', c.updateJobOpening);
router.delete('/jobs/:id', c.deleteJobOpening);

// Candidates
router.get('/candidates', c.getCandidates);
router.post('/candidates', c.createCandidate);
router.put('/candidates/:id', c.updateCandidate);
router.delete('/candidates/:id', c.deleteCandidate);

// Interviews
router.get('/interviews', c.getInterviews);
router.post('/interviews', c.createInterview);
router.put('/interviews/:id', c.updateInterview);
router.delete('/interviews/:id', c.deleteInterview);

module.exports = router;
