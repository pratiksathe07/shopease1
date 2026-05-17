// ============================================================
// utils/ApiError.js
// Custom Error class for consistent error responses across the app
// Usage: throw new ApiError(404, 'Product not found')
// ============================================================

class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code (400, 401, 403, 404, 500...)
   * @param {string} message    - Human-readable error message
   * @param {Array}  errors     - Optional array of validation errors
   */
  constructor(statusCode, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.success = false;
    this.isOperational = true; // Marks this as a known/expected error

    // Capture the stack trace (excludes constructor call from stack)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
