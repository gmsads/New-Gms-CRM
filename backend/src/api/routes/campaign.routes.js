const express = require('express');
const router = express.Router();
const { getCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign } = require('../controllers/campaign.controller');
const { protect, authorize } = require('../../guards/auth.guard');

router.use(protect);

router.route('/')
  .get(getCampaigns)
  .post(authorize('ADMIN', 'SALES_MANAGER', 'OPERATION_MANAGER'), createCampaign);

router.route('/:id')
  .get(getCampaign)
  .put(authorize('ADMIN', 'SALES_MANAGER', 'OPERATION_MANAGER', 'OPERATION_EXEC'), updateCampaign)
  .delete(authorize('ADMIN', 'SALES_MANAGER'), deleteCampaign);

module.exports = router;
