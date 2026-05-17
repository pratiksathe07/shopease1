// ============================================================
// middleware/adminMiddleware.js
// Restricts access to users with role === 'admin'
// Must be used AFTER the protect middleware
// Usage in routes: router.post('/', protect, adminOnly, createProduct)
// ============================================================

const ApiError = require('../utils/ApiError');

/**
 * adminOnly — role-based authorization middleware
 * Checks that req.user.role is 'admin'
 * Requires protect middleware to run first (sets req.user)
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next(); // User is admin — allow through
  }

  // User is logged in but doesn't have admin privileges
  next(new ApiError(403, 'Access denied. Admin privileges required.'));
};

module.exports = { adminOnly };
