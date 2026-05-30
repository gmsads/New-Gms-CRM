const express = require('express');
const router = express.Router();
const c = require('../controllers/hrCompensation.controller');
const { protect, hrOnly } = require('../../guards/auth.guard');

router.use(protect);
router.use(hrOnly);

// Compensation
router.get('/compensations', c.getCompensations);
router.post('/compensations', c.createCompensation);
router.put('/compensations/:id', c.updateCompensation);
router.delete('/compensations/:id', c.deleteCompensation);

// Payslips
router.get('/payslips', c.getPayslips);
router.post('/payslips', c.createPayslip);
router.put('/payslips/:id', c.updatePayslip);
router.delete('/payslips/:id', c.deletePayslip);

module.exports = router;
