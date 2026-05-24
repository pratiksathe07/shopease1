// ============================================================
// models/Image.js
// Mongoose schema for storing product images in MongoDB
// Images are stored as Base64 strings so they persist across
// server restarts / redeploys (no dependency on disk storage)
// ============================================================

const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    // Base64-encoded image data (e.g. "data:image/png;base64,...")
    data: {
      type:     String,
      required: [true, 'Image data is required'],
    },

    // MIME type — e.g. "image/jpeg", "image/png", "image/webp"
    contentType: {
      type:     String,
      required: [true, 'Content type is required'],
      enum:     ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    },

    // Original filename for reference / debugging
    filename: {
      type:    String,
      default: 'upload',
    },

    // File size in bytes (stored for info; limit enforced by multer)
    size: {
      type: Number,
      default: 0,
    },

    // The admin who uploaded this image (optional, for audit trail)
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

const Image = mongoose.model('Image', imageSchema);
module.exports = Image;
