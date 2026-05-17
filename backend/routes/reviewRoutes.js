// ============================================================
// routes/reviewRoutes.js
// Review routes — Public GET, User POST/PUT/DELETE own reviews
// ============================================================

const express = require('express');
const router  = express.Router();

const { addReview, getProductReviews, updateReview, deleteReview, canReview } = require('../controllers/reviewController');
const { protect }   = require('../middleware/authMiddleware');
const { reviewValidation, validateRequest } = require('../middleware/validateMiddleware');

// ── Public ──────────────────────────────────────
router.get('/', getProductReviews); // GET /api/reviews?productId=xxx

// ── Protected ───────────────────────────────────
router.get('/can-review', protect, canReview); // GET /api/reviews/can-review?productId=xxx
router.post('/',      protect, reviewValidation, validateRequest, addReview);
router.put('/:id',    protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
