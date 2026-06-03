const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { protect, authorize } = require('../../guards/auth.guard');

// All settings routes are protected and admin-only
router.use(protect);
router.use(authorize('ADMIN', 'MD_CEO', 'HR'));

router.get('/', settingsController.getGlobalSettings);
router.put('/roles/add', settingsController.addRole);
router.put('/roles/remove', settingsController.removeRole);
router.put('/departments/add', settingsController.addDepartment);
router.put('/departments/remove', settingsController.removeDepartment);

module.exports = router;
