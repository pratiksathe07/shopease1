// ============================================================
// controllers/paymentController.js
// Handles: Record payment, get user payments, admin payment list
// ============================================================

const Payment     = require('../models/Payment');
const Order       = require('../models/Order');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');

// POST /api/payments — User: record payment for an order
const recordPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethod, transactionId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return next(new ApiError(404, 'Order not found.'));
    if (order.userId.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Not authorized.'));
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({ orderId });
    if (existingPayment && existingPayment.paymentStatus === 'Paid') {
      return next(new ApiError(409, 'Payment already recorded for this order.'));
    }

    let payment;
    if (existingPayment) {
      // Update existing payment record
      existingPayment.paymentStatus = 'Paid';
      existingPayment.transactionId = transactionId || existingPayment.transactionId;
      existingPayment.paidAt        = new Date();
      payment = await existingPayment.save();
    } else {
      payment = await Payment.create({
        userId:        req.user._id,
        orderId,
        amount:        order.totalAmount,
        paymentMethod: paymentMethod || order.paymentMethod,
        paymentStatus: 'Paid',
        transactionId: transactionId || `TXN-${Date.now()}`,
        paidAt:        new Date(),
      });
    }

    // Update order payment status
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'Paid',
      orderStatus:   'Confirmed',
      paymentId:     payment._id,
    });

    res.status(201).json(new ApiResponse(201, payment, 'Payment recorded successfully.'));
  } catch (error) { next(error); }
};

// GET /api/payments/my — User: own payment history
const getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('orderId', 'orderStatus totalAmount');
    res.status(200).json(new ApiResponse(200, payments, 'Payments fetched.'));
  } catch (error) { next(error); }
};

// GET /api/admin/payments — Admin: all payments
const getAllPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.paymentStatus = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).populate('userId', 'name email').populate('orderId', 'orderStatus'),
      Payment.countDocuments(filter),
    ]);
    res.status(200).json(new ApiResponse(200, { payments, pagination: { page: parseInt(page), limit: parseInt(limit), total } }, 'All payments fetched.'));
  } catch (error) { next(error); }
};

module.exports = { recordPayment, getMyPayments, getAllPayments };
