// ============================================================
// middleware/authMiddleware.js
// Protects routes — verifies JWT token from Authorization header
// Usage in routes: router.get('/me', protect, getMe)
// ============================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * protect — JWT authentication middleware
 * Checks for Bearer token in Authorization header
 * Attaches decoded user to req.user
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization: Bearer <token>
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // No token provided
    if (!token) {
      return next(new ApiError(401, 'Access denied. Please log in first.'));
    }

    // Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new ApiError(401, 'Session expired. Please log in again.'));
      }
      return next(new ApiError(401, 'Invalid token. Please log in again.'));
    }

    // Find the user from the token's payload id
    // .select('+password') is NOT used here — we don't need password in protected routes
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new ApiError(401, 'User no longer exists.'));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'Your account has been deactivated.'));
    }

    // Attach user to request object — available in all subsequent handlers
    req.user = user;
    next();

  } catch (error) {
    next(error);
  }
};

module.exports = { protect };
