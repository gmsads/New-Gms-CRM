const express = require('express');
const router = express.Router();

const { protect, authorize } = require('../../guards/auth.guard');

const vendorController = require('../controllers/vendor.controller');
const vendorCategoryController = require('../controllers/vendorCategory.controller');
const vendorAssignmentController = require('../controllers/vendorAssignment.controller');
const vendorPaymentController = require('../controllers/vendorPayment.controller');

// Secure all routes
router.use(protect);

// ---- VENDOR CATEGORIES ----
router
  .route('/categories')
  .get(vendorCategoryController.getAllCategories)
  .post(authorize('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorCategoryController.createCategory);

router
  .route('/categories/:id')
  .patch(authorize('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorCategoryController.updateCategory)
  .delete(authorize('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorCategoryController.deleteCategory);

// ---- VENDORS ----
router
  .route('/')
  .get(vendorController.getAllVendors)
  .post(authorize('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorController.createVendor);

router
  .route('/:id')
  .get(vendorController.getVendor)
  .patch(authorize('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorController.updateVendor)
  .delete(authorize('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorController.deleteVendor);

// ---- VENDOR ASSIGNMENTS ----
router
  .route('/assignments')
  .get(vendorAssignmentController.getAllAssignments)
  .post(authorize('OPERATION_MANAGER', 'OPERATION_EXEC', 'ADMIN', 'MD_CEO'), vendorAssignmentController.createAssignment);

router
  .route('/assignments/:id')
  .patch(authorize('OPERATION_MANAGER', 'OPERATION_EXEC', 'ADMIN', 'MD_CEO'), vendorAssignmentController.updateAssignment)
  .delete(authorize('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorAssignmentController.deleteAssignment);

// ---- VENDOR PAYMENTS ----
router
  .route('/payments')
  .get(vendorPaymentController.getAllPayments)
  .post(authorize('ACCOUNTS', 'ADMIN', 'MD_CEO'), vendorPaymentController.createPayment);

router
  .route('/payments/:id')
  .patch(authorize('ACCOUNTS', 'ADMIN', 'MD_CEO'), vendorPaymentController.updatePayment)
  .delete(authorize('ADMIN', 'MD_CEO'), vendorPaymentController.deletePayment);

module.exports = router;
