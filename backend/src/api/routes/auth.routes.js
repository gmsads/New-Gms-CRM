const express = require('express');
const router  = express.Router();
const {
  registerUser, loginUser, getUserProfile,
  changePassword, resetPassword, setup, debugMe,
} = require('../controllers/auth.controller');
const { protect, authorize } = require('../../guards/auth.guard');

// ── Public routes ─────────────────────────────────────────────
router.get('/setup',    setup);          // GET /api/auth/setup  → creates first admin
router.post('/login',   loginUser);      // POST /api/auth/login
router.post('/register', registerUser);  // disabled — returns 410

// ── Protected routes ──────────────────────────────────────────
router.get('/me',                   protect, getUserProfile);
router.get('/debug-me',            protect, debugMe);
router.post('/change-password',     protect, changePassword);
router.post('/reset-password/:id',  protect, authorize('ADMIN', 'MD_CEO', 'HR'), resetPassword);

module.exports = router;
