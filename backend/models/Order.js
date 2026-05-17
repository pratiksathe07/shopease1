// ============================================================
// models/Order.js
// Mongoose schema for Orders collection
// Handles: items, shipping address, payment method, order status
// ============================================================

const mongoose = require('mongoose');

// ─── Sub-schema for each product line item in an order ───
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Product',
      required: true,
    },
    name:     { type: String, required: true },  // Snapshot at time of order
    price:    { type: Number, required: true },  // Snapshot at time of order
    quantity: { type: Number, required: true, min: [1, 'Quantity must be at least 1'] },
    image:    { type: String, default: '' },     // Snapshot of product image URL
  },
  { _id: false }
);

// ─── Sub-schema for shipping address (snapshot at time of order) ───
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    mobile:   { type: String, required: true },
    street:   { type: String, required: true },
    city:     { type: String, required: true },
    state:    { type: String, required: true },
    pincode:  { type: String, required: true },
    country:  { type: String, default: 'India' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    items: {
      type:     [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message:   'Order must have at least one item',
      },
    },

    shippingAddress: {
      type:     shippingAddressSchema,
      required: true,
    },

    paymentMethod: {
      type:     String,
      required: true,
      enum:     ['COD', 'UPI', 'Card', 'NetBanking', 'Wallet'],
      default:  'COD',
    },

    paymentStatus: {
      type:    String,
      enum:    ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },

    // Tracks where the order is in its lifecycle
    orderStatus: {
      type:    String,
      enum:    ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
    },

    totalAmount: {
      type:     Number,
      required: true,
      min:      [0, 'Total amount cannot be negative'],
    },

    // Reference to Payment document (set after payment is recorded)
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'Payment',
    },

    // Optional notes from customer
    notes: { type: String, default: '' },
  },
  {
    timestamps: true, // createdAt = order placed date, updatedAt = last status change
  }
);

// ──────────────────────────────────────────────────
// INDEX: Speed up lookups by user and status
// ──────────────────────────────────────────────────
orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 }); // Latest orders first

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
