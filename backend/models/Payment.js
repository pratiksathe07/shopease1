// ============================================================
// models/Payment.js
// Mongoose schema for Payments collection
// Tracks payment transactions linked to orders
// ============================================================

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    orderId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Order',
      required: true,
      unique:   true, // One payment per order
    },

    amount: {
      type:     Number,
      required: [true, 'Payment amount is required'],
      min:      [0, 'Amount cannot be negative'],
    },

    paymentMethod: {
      type:     String,
      required: true,
      enum:     ['COD', 'UPI', 'Card', 'NetBanking', 'Wallet'],
    },

    paymentStatus: {
      type:    String,
      enum:    ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },

    // Unique reference from payment gateway (e.g. Razorpay payment_id)
    // For COD this will be auto-generated as 'COD-<timestamp>'
    transactionId: {
      type:    String,
      default: '',
    },

    // Timestamp when payment was actually completed
    paidAt: {
      type: Date,
    },

    // Optional metadata (gateway response, etc.)
    gatewayResponse: {
      type:    mongoose.Schema.Types.Mixed, // Flexible schema for any gateway
      default: {},
    },
  },
  {
    timestamps: true, // createdAt = payment initiated
  }
);

// Index for quick lookup by user
paymentSchema.index({ userId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
