// ============================================================
// routes/paymentRoutes.js
// Payment routes — User: record/view | Admin: all payments
// ============================================================

const express = require('express');
const router  = express.Router();

const { recordPayment, getMyPayments, getAllPayments } = require('../controllers/paymentController');
const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// ── User (Protected) ────────────────────────────
router.post('/',    protect, recordPayment);
router.get('/my',   protect, getMyPayments);

// ── Admin only ───────────────────────────────────
router.get('/',     protect, adminOnly, getAllPayments);

module.exports = router;
