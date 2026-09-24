const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');
const { protect, authorize } = require('../../guards/auth.guard');

// RBAC: Generating and Managing invoices
// Only specific roles can issue and cancel invoices.
const generateRoles = ['MD_CEO', 'CEO', 'COO', 'BRANCH_HEAD', 'ADMIN', 'ACCOUNTS', 'SR_SALES_MANAGER', 'SALES_MANAGER'];

// All authenticated users with view access to sales can view invoices
router.get('/', protect, invoiceController.listInvoices);
router.get('/:id', protect, invoiceController.getInvoice);

// Only authorized roles can generate invoices
router.post('/', protect, authorize(...generateRoles), invoiceController.generateInvoice);

// Only highly authorized roles can cancel invoices
router.post('/:id/cancel', protect, authorize('MD_CEO', 'CEO', 'ADMIN', 'ACCOUNTS'), invoiceController.cancelInvoice);

module.exports = router;
