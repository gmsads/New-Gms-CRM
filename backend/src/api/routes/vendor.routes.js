const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const permissionController = require('../controllers/permission.controller');

const vendorController = require('../controllers/vendor.controller');
const vendorCategoryController = require('../controllers/vendorCategory.controller');
const vendorAssignmentController = require('../controllers/vendorAssignment.controller');
const vendorPaymentController = require('../controllers/vendorPayment.controller');

// Secure all routes
router.use(authController.protect);

// ---- VENDOR CATEGORIES ----
router
  .route('/categories')
  .get(vendorCategoryController.getAllCategories)
  .post(permissionController.restrictTo('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorCategoryController.createCategory);

router
  .route('/categories/:id')
  .patch(permissionController.restrictTo('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorCategoryController.updateCategory)
  .delete(permissionController.restrictTo('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorCategoryController.deleteCategory);

// ---- VENDORS ----
router
  .route('/')
  .get(vendorController.getAllVendors)
  .post(permissionController.restrictTo('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorController.createVendor);

router
  .route('/:id')
  .get(vendorController.getVendor)
  .patch(permissionController.restrictTo('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorController.updateVendor)
  .delete(permissionController.restrictTo('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorController.deleteVendor);

// ---- VENDOR ASSIGNMENTS ----
router
  .route('/assignments')
  .get(vendorAssignmentController.getAllAssignments)
  .post(permissionController.restrictTo('OPERATION_MANAGER', 'OPERATION_EXEC', 'ADMIN', 'MD_CEO'), vendorAssignmentController.createAssignment);

router
  .route('/assignments/:id')
  .patch(permissionController.restrictTo('OPERATION_MANAGER', 'OPERATION_EXEC', 'ADMIN', 'MD_CEO'), vendorAssignmentController.updateAssignment)
  .delete(permissionController.restrictTo('OPERATION_MANAGER', 'ADMIN', 'MD_CEO'), vendorAssignmentController.deleteAssignment);

// ---- VENDOR PAYMENTS ----
router
  .route('/payments')
  .get(vendorPaymentController.getAllPayments)
  .post(permissionController.restrictTo('ACCOUNTS', 'ADMIN', 'MD_CEO'), vendorPaymentController.createPayment);

router
  .route('/payments/:id')
  .patch(permissionController.restrictTo('ACCOUNTS', 'ADMIN', 'MD_CEO'), vendorPaymentController.updatePayment)
  .delete(permissionController.restrictTo('ADMIN', 'MD_CEO'), vendorPaymentController.deletePayment);

module.exports = router;
