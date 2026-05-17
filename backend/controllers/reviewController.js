// ============================================================
// controllers/reviewController.js
// ============================================================

const Review      = require('../models/Review');
const Order       = require('../models/Order');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');

// POST /api/reviews — User: add review (only for purchased + delivered products)
const addReview = async (req, res, next) => {
  try {
    const { productId, rating, comment } = req.body;

    // ── Gate: user must have a DELIVERED order containing this product ──
    const deliveredOrder = await Order.findOne({
      userId:        req.user._id,
      orderStatus:   'Delivered',
      'items.productId': productId,
    });

    if (!deliveredOrder) {
      return next(new ApiError(403, 'You can only review products you have purchased and received.'));
    }

    // Check if user already reviewed this product
    const existing = await Review.findOne({ userId: req.user._id, productId });
    if (existing) {
      return next(new ApiError(409, 'You have already reviewed this product. Update your existing review instead.'));
    }

    const review = await Review.create({
      userId:    req.user._id,
      productId,
      rating:    Number(rating),
      comment:   comment || '',
    });

    // Populate user name for response
    await review.populate('userId', 'name');

    res.status(201).json(new ApiResponse(201, review, 'Review added successfully.'));
  } catch (error) { next(error); }
};

// GET /api/reviews?productId=xxx — Public: reviews for a product
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.query;
    if (!productId) return next(new ApiError(400, 'productId query parameter is required.'));

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name');

    res.status(200).json(new ApiResponse(200, reviews, 'Reviews fetched.'));
  } catch (error) { next(error); }
};

// PUT /api/reviews/:id — User: update own review
const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new ApiError(404, 'Review not found.'));
    if (review.userId.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Not authorized to edit this review.'));
    }

    const { rating, comment } = req.body;
    if (rating  !== undefined) review.rating  = Number(rating);
    if (comment !== undefined) review.comment = comment;
    await review.save(); // Post-save hook updates product rating

    res.status(200).json(new ApiResponse(200, review, 'Review updated successfully.'));
  } catch (error) { next(error); }
};

// DELETE /api/reviews/:id — User (own) or Admin
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(new ApiError(404, 'Review not found.'));

    const isOwner = review.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return next(new ApiError(403, 'Not authorized to delete this review.'));
    }

    await Review.findOneAndDelete({ _id: req.params.id }); // Triggers post-delete hook
    res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully.'));
  } catch (error) { next(error); }
};

// GET /api/reviews/can-review?productId=xxx — check if user can review
const canReview = async (req, res, next) => {
  try {
    const { productId } = req.query;
    if (!productId) return next(new ApiError(400, 'productId is required.'));

    const [deliveredOrder, existingReview] = await Promise.all([
      Order.findOne({
        userId: req.user._id,
        orderStatus: 'Delivered',
        'items.productId': productId,
      }),
      Review.findOne({ userId: req.user._id, productId }),
    ]);

    res.status(200).json(new ApiResponse(200, {
      canReview:      !!deliveredOrder && !existingReview,
      hasPurchased:   !!deliveredOrder,
      alreadyReviewed: !!existingReview,
    }, 'Review eligibility checked.'));
  } catch (error) { next(error); }
};

module.exports = { addReview, getProductReviews, updateReview, deleteReview, canReview };

