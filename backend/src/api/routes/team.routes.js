const express = require('express');
const router = express.Router();
const teamController = require('../controllers/team.controller');
const { protect, authorize } = require('../../guards/auth.guard');

router.use(protect);
router.use(authorize('ADMIN', 'MD_CEO', 'SALES_MANAGER', 'SR_SALES_MANAGER', 'HR'));

router.post('/', teamController.createTeam);
router.get('/', teamController.listTeams);
router.patch('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;
