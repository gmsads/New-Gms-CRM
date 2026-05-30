const express = require('express');
const router = express.Router();
const designController = require('../controllers/design.controller');
const { protect, authorize } = require('../../guards/auth.guard');
const upload = require('../../core/middlewares/upload.middleware');

// Base route: /api/design

// -- Services
router.get('/services', protect, authorize('ADMIN', 'MD_CEO', 'SALES_MANAGER', 'OPERATION_MANAGER', 'DESIGNER'), designController.getServices);
router.patch('/services/:orderId/:itemIndex/status', protect, authorize('ADMIN', 'OPERATION_MANAGER', 'DESIGNER'), designController.updateServiceStatus);
router.post('/services/:orderId/:itemIndex/files', protect, authorize('ADMIN', 'OPERATION_MANAGER', 'DESIGNER'), upload.fields([{ name: 'designAsset', maxCount: 1 }]), designController.uploadServiceFile);

// -- Assets
router.get('/assets', protect, authorize('ADMIN', 'DESIGNER', 'OPERATION_MANAGER'), designController.getAssets);
router.post('/assets', protect, authorize('ADMIN', 'DESIGNER'), upload.fields([{ name: 'designAsset', maxCount: 1 }]), designController.createAsset);

module.exports = router;
