const express = require('express');
const router = express.Router();
const c = require('../controllers/employee.controller');
const { protect, authorize, preventRoleEscalation, hrOnly, adminOnly } = require('../../guards/auth.guard');

router.use(protect);
router.get('/', hrOnly, c.getEmployees);
router.get('/:id', hrOnly, c.getEmployee);
router.post('/', hrOnly, preventRoleEscalation, c.createEmployee);
router.put('/:id', hrOnly, preventRoleEscalation, c.updateEmployee);
router.put('/:id/status', authorize('ADMIN', 'MD_CEO', 'HR'), c.changeStatus);  // HR can toggle active/inactive
router.post('/:id/reset-password', authorize('ADMIN', 'MD_CEO', 'HR'), c.resetEmployeePassword);
router.patch('/:id/target', authorize('ADMIN', 'MD_CEO', 'SALES_MANAGER'), c.updateTarget);
router.delete('/:id', adminOnly, c.deleteEmployee);

module.exports = router;
