const express = require('express');
const router = express.Router();
const { getClients, getClient, createClient, updateClient, deleteClient } = require('../controllers/client.controller');
const client360Controller = require('../controllers/client360.controller');
const { protect, authorize } = require('../../guards/auth.guard');

router.use(protect);

router.route('/')
  .get(getClients)
  .post(authorize('ADMIN', 'SALES_MANAGER', 'SALES_EXEC'), createClient);

// Client 360 / Ledger routes (Mobile-based lookup)
router.get('/mobile/:phone/ledger', client360Controller.getLedgerSummaryByMobile);
router.get('/mobile/:phone/prospect', client360Controller.getProspectsByMobile);
router.get('/mobile/:phone/followups', client360Controller.getFollowupsByMobile);
router.get('/mobile/:phone/appointments', client360Controller.getAppointmentsByMobile);
router.get('/mobile/:phone/orders', client360Controller.getOrdersByMobile);
router.get('/mobile/:phone/payments', client360Controller.getPaymentsByMobile);
router.get('/mobile/:phone/timeline', client360Controller.getTimelineByMobile);
router.get('/mobile/:phone/documents', client360Controller.getDocumentsByMobile);

router.route('/:id')
  .get(getClient)
  .put(authorize('ADMIN', 'SALES_MANAGER', 'SALES_EXEC'), updateClient)
  .delete(authorize('ADMIN', 'SALES_MANAGER'), deleteClient);

module.exports = router;
