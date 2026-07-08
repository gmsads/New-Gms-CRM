const express = require('express');
const router = express.Router();
const {
  getAvailablePermissions,
  getAllAssignedPermissions,
  getUserPermissions,
  assignPermission,
  revokePermission
} = require('../controllers/permission.controller');
const { protect, authorize } = require('../../guards/auth.guard');

// Only Admins and MD_CEO can manage permissions
router.use(protect);
router.use(authorize('ADMIN', 'MD_CEO'));

router.get('/available', getAvailablePermissions);
router.get('/assigned', getAllAssignedPermissions);
router.get('/user/:userId', getUserPermissions);
router.post('/assign', assignPermission);
router.delete('/revoke/:id', revokePermission);

module.exports = router;
