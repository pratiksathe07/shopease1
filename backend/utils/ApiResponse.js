// ============================================================
// utils/ApiResponse.js
// Standard success response format for all API endpoints
// Usage: res.json(new ApiResponse(200, data, 'Products fetched'))
// ============================================================

class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code (200, 201...)
   * @param {*}      data       - The response payload
   * @param {string} message    - Human-readable success message
   */
  constructor(statusCode, data, message = 'Success') {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }
}

module.exports = ApiResponse;
