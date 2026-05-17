// ============================================================
// utils/generateToken.js
// Creates a signed JWT token for a given user ID
// Called in authController after successful login/register
// ============================================================

const jwt = require('jsonwebtoken');

/**
 * generateToken — signs and returns a JWT
 * @param {string} userId - MongoDB _id of the user
 * @returns {string} signed JWT string
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },                          // Payload
    process.env.JWT_SECRET,                  // Secret key from .env
    { expiresIn: process.env.JWT_EXPIRE }    // Expiry (e.g. '30d')
  );
};

module.exports = generateToken;
