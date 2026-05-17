// ============================================================
// routes/orderRoutes.js
// Order routes — User: place/view/cancel | Admin: all/update status
// ============================================================

const express = require('express');
const router  = express.Router();

const {
  placeOrder, getMyOrders, getOrderById,
  cancelOrder, getAllOrders, updateOrderStatus,
} = require('../controllers/orderController');

const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { orderValidation, validateRequest } = require('../middleware/validateMiddleware');

// ── User (Protected) ────────────────────────────
router.post('/',              protect, orderValidation, validateRequest, placeOrder);
router.get('/my',             protect, getMyOrders);
router.get('/:id',            protect, getOrderById);
router.put('/:id/cancel',     protect, cancelOrder);

// ── Admin only ───────────────────────────────────
router.get('/',               protect, adminOnly, getAllOrders);
router.put('/:id/status',     protect, adminOnly, updateOrderStatus);

module.exports = router;
