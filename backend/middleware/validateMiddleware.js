// ============================================================
// middleware/validateMiddleware.js
// Input validation rules using express-validator
// Usage: import the validator array and use in route:
//   router.post('/login', loginValidation, validateRequest, loginUser)
// ============================================================

const { body, validationResult } = require('express-validator');

// ──────────────────────────────────────────────────
// validateRequest — runs after validation rules
// Collects validation errors and returns 422 if any exist
// ──────────────────────────────────────────────────
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorList = errors.array().map((e) => ({ field: e.path, message: e.msg }));
    // Build a readable summary e.g. "name: Name is required; email: Enter a valid email"
    const summary = errorList.map(e => `${e.field}: ${e.message}`).join(' | ');
    return res.status(422).json({
      success:    false,
      statusCode: 422,
      message:    `Validation failed — ${summary}`,
      errors:     errorList,
    });
  }

  next();
};

// ──────────────────────────────────────────────────
// AUTH VALIDATORS
// ──────────────────────────────────────────────────
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address'),
    // NOTE: normalizeEmail() removed — it mangles valid addresses like user+tag@gmail.com

  body('mobile')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^[6-9][0-9]{9}$/).withMessage('Enter a valid 10-digit Indian mobile number (starts with 6–9)'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address'),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// ──────────────────────────────────────────────────
// PRODUCT VALIDATORS
// ──────────────────────────────────────────────────
const productValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ max: 150 }).withMessage('Name cannot exceed 150 characters'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required')
    .isIn(['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty', 'Books', 'Toys', 'Other'])
    .withMessage('Invalid category'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price must be a positive number'),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
];

// ──────────────────────────────────────────────────
// ORDER VALIDATORS
// ──────────────────────────────────────────────────
const orderValidation = [
  body('items')
    .isArray({ min: 1 }).withMessage('Order must have at least one item'),

  body('items.*.productId')
    .notEmpty().withMessage('Product ID is required for each item')
    .isMongoId().withMessage('Invalid product ID'),

  body('items.*.quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),

  body('shippingAddress.fullName').trim().notEmpty().withMessage('Full name is required'),
  body('shippingAddress.mobile').trim().notEmpty().withMessage('Mobile is required'),
  body('shippingAddress.street').trim().notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.pincode').trim().notEmpty().withMessage('Pincode is required'),

  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['COD', 'UPI', 'Card', 'NetBanking', 'Wallet'])
    .withMessage('Invalid payment method'),
];

// ──────────────────────────────────────────────────
// REVIEW VALIDATORS
// ──────────────────────────────────────────────────
const reviewValidation = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),

  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
];

module.exports = {
  validateRequest,
  registerValidation,
  loginValidation,
  changePasswordValidation,
  productValidation,
  orderValidation,
  reviewValidation,
};
