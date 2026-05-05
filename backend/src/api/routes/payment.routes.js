const express = require('express');
const router  = express.Router();

const { protect }                                    = require('../../guards/auth.guard');
const { can }                                        = require('../../guards/role.guard');
const { requireProof, preventSelfVerification }      = require('../../guards/payment.guard');
const ctrl = require('../controllers/payment.controller');

router.use(protect);

router.get('/',         can('payments:read'),    ctrl.list);
router.get('/pending',  can('payments:verify'),  ctrl.pendingVerification);
router.get('/:id',      can('payments:read'),    ctrl.getOne);

router.post('/',
  can('payments:collect'),
  requireProof,
  ctrl.create
);

router.post('/:id/verify',
  can('payments:verify'),
  preventSelfVerification,
  ctrl.verify
);

router.post('/:id/reject',
  can('payments:reject'),
  ctrl.reject
);

module.exports = router;
