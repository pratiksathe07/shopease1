// ============================================================
// controllers/orderController.js
// Handles: Place order, view orders, update status, cancel
// ============================================================

const Order       = require('../models/Order');
const Product     = require('../models/Product');
const Payment     = require('../models/Payment');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');

// POST /api/orders — User: place order
const placeOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;

    // Build order items with product snapshots and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return next(new ApiError(404, `Product not found: ${item.productId}`));
      }
      if (product.stock < item.quantity) {
        return next(new ApiError(400, `Insufficient stock for "${product.name}". Available: ${product.stock}`));
      }

      orderItems.push({
        productId: product._id,
        name:      product.name,
        price:     product.price,
        quantity:  item.quantity,
        image:     product.images[0] || '',
      });
      totalAmount += product.price * item.quantity;

      // Decrement stock
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
    }

    const order = await Order.create({
      userId:          req.user._id,
      items:           orderItems,
      shippingAddress,
      paymentMethod,
      totalAmount,
      notes: notes || '',
    });

    // Auto-create Payment record for COD
    if (paymentMethod === 'COD') {
      const payment = await Payment.create({
        userId:        req.user._id,
        orderId:       order._id,
        amount:        totalAmount,
        paymentMethod: 'COD',
        paymentStatus: 'Pending',
        transactionId: `COD-${Date.now()}`,
      });
      await Order.findByIdAndUpdate(order._id, { paymentId: payment._id });
    }

    res.status(201).json(new ApiResponse(201, order, 'Order placed successfully!'));
  } catch (error) { next(error); }
};

// GET /api/orders/my — User: get own orders
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, orders, 'Orders fetched.'));
  } catch (error) { next(error); }
};

// GET /api/orders/:id — User: single order
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new ApiError(404, 'Order not found.'));
    // Ensure user can only see their own orders (admin bypass)
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError(403, 'Not authorized to view this order.'));
    }
    res.status(200).json(new ApiResponse(200, order, 'Order fetched.'));
  } catch (error) { next(error); }
};

// PUT /api/orders/:id/cancel — User: cancel order
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(new ApiError(404, 'Order not found.'));
    if (order.userId.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'Not authorized.'));
    }
    if (['Shipped', 'Delivered'].includes(order.orderStatus)) {
      return next(new ApiError(400, `Cannot cancel an order that is already ${order.orderStatus}.`));
    }
    if (order.orderStatus === 'Cancelled') {
      return next(new ApiError(400, 'Order is already cancelled.'));
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
    }

    order.orderStatus = 'Cancelled';
    await order.save();
    res.status(200).json(new ApiResponse(200, order, 'Order cancelled successfully.'));
  } catch (error) { next(error); }
};

// GET /api/admin/orders — Admin: all orders
const getAllOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.orderStatus = status;
    const pageNum  = parseInt(page);
    const limitNum = parseInt(limit);
    const skip     = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate('userId', 'name email'),
      Order.countDocuments(filter),
    ]);
    res.status(200).json(new ApiResponse(200, { orders, pagination: { page: pageNum, limit: limitNum, total } }, 'All orders fetched.'));
  } catch (error) { next(error); }
};

// PUT /api/admin/orders/:id/status — Admin: update status
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (orderStatus && !validStatuses.includes(orderStatus)) {
      return next(new ApiError(400, 'Invalid order status.'));
    }
    const updateFields = {};
    if (orderStatus)  updateFields.orderStatus  = orderStatus;
    if (paymentStatus) updateFields.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true });
    if (!order) return next(new ApiError(404, 'Order not found.'));
    res.status(200).json(new ApiResponse(200, order, 'Order status updated.'));
  } catch (error) { next(error); }
};

module.exports = { placeOrder, getMyOrders, getOrderById, cancelOrder, getAllOrders, updateOrderStatus };
