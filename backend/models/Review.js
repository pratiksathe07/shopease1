// ============================================================
// models/Review.js
// Mongoose schema for Reviews collection
// Handles product ratings and comments
// Each user can review a product only once (enforced by unique index)
// ============================================================

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    productId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Product',
      required: true,
    },

    rating: {
      type:     Number,
      required: [true, 'Rating is required'],
      min:      [1, 'Rating must be at least 1'],
      max:      [5, 'Rating cannot exceed 5'],
    },

    comment: {
      type:      String,
      trim:      true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default:   '',
    },

    // URLs of review images (optional)
    images: {
      type:    [String],
      default: [],
    },
  },
  {
    timestamps: true, // createdAt = review date
    toJSON:     { virtuals: true },
  }
);

// ──────────────────────────────────────────────────
// COMPOUND UNIQUE INDEX: One review per user per product
// Prevents duplicate reviews from the same user
// ──────────────────────────────────────────────────
reviewSchema.index({ userId: 1, productId: 1 }, { unique: true });

// ──────────────────────────────────────────────────
// STATIC METHOD: Recalculate and update product's average rating
// Called after every review create/update/delete
// Usage: await Review.updateProductRating(productId)
// ──────────────────────────────────────────────────
reviewSchema.statics.updateProductRating = async function (productId) {
  const Product = require('./Product'); // Lazy import to avoid circular dep

  // Aggregate: calculate average rating and total count for this product
  const stats = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id:     '$productId',
        average: { $avg: '$rating' },
        count:   { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      'rating.average': Math.round(stats[0].average * 10) / 10, // Round to 1 decimal
      'rating.count':   stats[0].count,
    });
  } else {
    // No reviews left — reset to defaults
    await Product.findByIdAndUpdate(productId, {
      'rating.average': 0,
      'rating.count':   0,
    });
  }
};

// ──────────────────────────────────────────────────
// POST-SAVE HOOK: Update product rating after new review
// ──────────────────────────────────────────────────
reviewSchema.post('save', async function () {
  await this.constructor.updateProductRating(this.productId);
});

// ──────────────────────────────────────────────────
// POST-DELETE HOOK: Update product rating after review is removed
// ──────────────────────────────────────────────────
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.updateProductRating(doc.productId);
  }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
