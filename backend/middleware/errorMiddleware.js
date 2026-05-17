// ============================================================
// middleware/errorMiddleware.js
// Centralized error handling — catches all errors passed via next(err)
// Must be registered LAST in app.js (after all routes)
// ============================================================

const ApiError = require('../utils/ApiError');

/**
 * errorHandler — global Express error handling middleware
 * Signature must have 4 params (err, req, res, next) for Express to recognize it
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal Server Error';
  let errors     = err.errors     || [];

  // ── Mongoose: CastError (invalid MongoDB ObjectId) ──
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // ── Mongoose: Duplicate key (unique field violation) ──
  if (err.code === 11000) {
    statusCode = 409; // 409 Conflict
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`;
  }

  // ── Mongoose: Validation errors ──
  if (err.name === 'ValidationError') {
    statusCode = 422;
    errors  = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
    message = 'Validation failed. Please check your input.';
  }

  // ── JWT errors (belt-and-suspenders — authMiddleware already handles these) ──
  if (err.name === 'JsonWebTokenError')  { statusCode = 401; message = 'Invalid token.'; }
  if (err.name === 'TokenExpiredError')  { statusCode = 401; message = 'Token expired.'; }

  // Log in development only (don't expose stack trace in production)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR ${statusCode}] ${message}`, err.stack);
  } else {
    console.error(`[ERROR ${statusCode}] ${message}`);
  }

  res.status(statusCode).json({
    success:    false,
    statusCode: statusCode,
    message:    message,
    errors:     errors,
    // Show stack only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * notFound — 404 handler for unmatched routes
 * Registered before errorHandler in app.js
 */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = { errorHandler, notFound };
