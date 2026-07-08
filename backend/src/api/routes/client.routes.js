const express = require('express');
const router = express.Router();
const { getClients, getClient, createClient, updateClient, deleteClient } = require('../controllers/client.controller');
const { protect, authorize } = require('../../guards/auth.guard');

router.use(protect);

router.route('/')
  .get(getClients)
  .post(authorize('ADMIN', 'SALES_MANAGER', 'SALES_EXEC'), createClient);

router.route('/:id')
  .get(getClient)
  .put(authorize('ADMIN', 'SALES_MANAGER', 'SALES_EXEC'), updateClient)
  .delete(authorize('ADMIN', 'SALES_MANAGER'), deleteClient);

module.exports = router;
