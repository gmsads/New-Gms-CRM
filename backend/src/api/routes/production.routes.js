const express = require('express');
const router = express.Router();
const productionController = require('../controllers/production.controller');
const { protect, authorize } = require('../../guards/auth.guard');

// Apply protection to all production routes
router.use(protect);

// ── Role groupings ────────────────────────────────────────────────────────────
// PRODUCTION_MANAGER has full access to the production module
// PRODUCTION_EXEC has execution-level access
// ADMIN and MD_CEO have global oversight
const MANAGER_ROLES = ['ADMIN', 'MD_CEO', 'PRODUCTION_MANAGER'];
const EXEC_ROLES = ['PRODUCTION_EXEC'];
const ALL_PROD_ROLES = [...MANAGER_ROLES, ...EXEC_ROLES];

// ── Routes ──────────────────────────────────────────────────────────────────

// GET /api/production/jobs - Get all production jobs
router.get('/jobs', authorize(...ALL_PROD_ROLES), productionController.getProductionJobs);

// POST /api/production/jobs/:orderId/:itemIndex/assign - Manager assignment
router.post('/jobs/:orderId/:itemIndex/assign', authorize(...MANAGER_ROLES), productionController.assignJob);

// PATCH /api/production/jobs/:orderId/:itemIndex/status - Exec/Manager status update
router.patch('/jobs/:orderId/:itemIndex/status', authorize(...ALL_PROD_ROLES), productionController.updateStatus);

// POST /api/production/jobs/:orderId/:itemIndex/qc - Manager QC approval/rejection
router.post('/jobs/:orderId/:itemIndex/qc', authorize(...MANAGER_ROLES), productionController.performQC);

// POST /api/production/jobs/:orderId/:itemIndex/delay - Mark/Unmark as delayed
router.post('/jobs/:orderId/:itemIndex/delay', authorize(...ALL_PROD_ROLES), productionController.reportDelay);

// POST /api/production/jobs/:orderId/:itemIndex/proofs - Upload proofs/images
router.post('/jobs/:orderId/:itemIndex/proofs', authorize(...ALL_PROD_ROLES), productionController.uploadProof);

module.exports = router;
