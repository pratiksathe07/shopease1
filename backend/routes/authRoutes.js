// ============================================================
// routes/authRoutes.js
// Authentication & User management routes
// ============================================================

const express = require('express');
const router  = express.Router();

const {
  registerUser, loginUser, getMe, updateProfile,
  changePassword, getAllUsers, updateUserRole, deleteUser, getAdminStats,
} = require('../controllers/authController');

const { protect }    = require('../middleware/authMiddleware');
const { adminOnly }  = require('../middleware/adminMiddleware');
const {
  registerValidation, loginValidation, changePasswordValidation, validateRequest,
} = require('../middleware/validateMiddleware');

// ── Public ──────────────────────────────────────
router.post('/register', registerValidation, validateRequest, registerUser);
router.post('/login',    loginValidation,    validateRequest, loginUser);

// ── Protected (any logged-in user) ──────────────
router.get('/me',              protect, getMe);
router.put('/me',              protect, updateProfile);
router.put('/change-password', protect, changePasswordValidation, validateRequest, changePassword);

// ── Admin only ───────────────────────────────────
router.get('/admin/stats',            protect, adminOnly, getAdminStats);
router.get('/admin/users',            protect, adminOnly, getAllUsers);
router.put('/admin/users/:id/role',   protect, adminOnly, updateUserRole);
router.delete('/admin/users/:id',     protect, adminOnly, deleteUser);

module.exports = router;
