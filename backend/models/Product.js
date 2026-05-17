// ============================================================
// models/Product.js
// Mongoose schema for Products collection
// Handles: name, category, brand, price, stock, images, rating
// ============================================================

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Product name is required'],
      trim:      true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },

    description: {
      type:      String,
      trim:      true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default:   '',
    },

    category: {
      type:     String,
      required: [true, 'Category is required'],
      trim:     true,
      // Matches categories used in the frontend
      enum: ['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty', 'Books', 'Toys', 'Other'],
    },

    brand: {
      type:    String,
      trim:    true,
      default: 'Generic',
    },

    price: {
      type:     Number,
      required: [true, 'Price is required'],
      min:      [0, 'Price cannot be negative'],
    },

    stock: {
      type:    Number,
      default: 0,
      min:     [0, 'Stock cannot be negative'],
    },

    // Array of image URLs (Unsplash links or uploaded file paths)
    images: {
      type:    [String],
      default: [],
    },

    // Virtual rating — calculated from Reviews collection
    // Stored here for quick display without joining reviews every time
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },

    isActive: {
      type:    Boolean,
      default: true, // Soft delete: inactive products won't show in listings
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ──────────────────────────────────────────────────
// VIRTUAL: First image URL shortcut
// Usage: product.mainImage
// ──────────────────────────────────────────────────
productSchema.virtual('mainImage').get(function () {
  return this.images && this.images.length > 0 ? this.images[0] : '';
});

// ──────────────────────────────────────────────────
// INDEX: Speed up searches and filters
// ──────────────────────────────────────────────────
productSchema.index({ name: 'text', description: 'text' }); // Full-text search
productSchema.index({ category: 1 });                        // Category filter
productSchema.index({ price: 1 });                           // Price sort
productSchema.index({ isActive: 1 });                        // Active listing filter

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
