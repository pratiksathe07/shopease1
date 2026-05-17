// ============================================================
// controllers/authController.js
// Handles: Register, Login, Get Profile, Update Profile, Change Password
// ============================================================

const User          = require('../models/User');
const generateToken = require('../utils/generateToken');
const ApiResponse   = require('../utils/ApiResponse');
const ApiError      = require('../utils/ApiError');

// ─────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────
const registerUser = async (req, res, next) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return next(new ApiError(409, 'An account with this email already exists.'));
    }

    // Create new user (password hashing happens in pre-save hook in User model)
    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      mobile,
      password,
      role: 'user', // Always register as user — admin role is set manually in DB
    });

    // Generate JWT for immediate login after registration
    const token = generateToken(user._id);

    res.status(201).json(
      new ApiResponse(201, {
        token,
        user: user.toSafeObject(), // Password excluded
      }, 'Account created successfully! Welcome to ShopEase.')
    );

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @desc    Login user — returns JWT
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────
const loginUser = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    // Find user by email — explicitly select password (it's hidden by default)
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return next(new ApiError(401, 'Invalid user ID and password. Please try again.'));
    }

    if (!user.isActive) {
      return next(new ApiError(403, 'Your account has been deactivated. Please contact support.'));
    }

    // Compare entered password with hashed password in DB
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid user ID and password. Please try again.'));
    }

    // Role check — if client says they're logging in as admin, verify it
    if (role === 'admin' && user.role !== 'admin') {
      return next(new ApiError(403, 'Access denied. You do not have admin privileges.'));
    }

    // Generate JWT
    const token = generateToken(user._id);

    res.status(200).json(
      new ApiResponse(200, {
        token,
        user: user.toSafeObject(),
      }, `Welcome back, ${user.name}!`)
    );

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @desc    Get currently logged-in user's profile
// @route   GET /api/auth/me
// @access  Protected (JWT required)
// ─────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by authMiddleware (protect)
    const user = await User.findById(req.user._id);

    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    res.status(200).json(
      new ApiResponse(200, user.toSafeObject(), 'Profile fetched successfully.')
    );

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @desc    Update profile (name, mobile, address)
// @route   PUT /api/auth/me
// @access  Protected
// ─────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, mobile, address } = req.body;

    // Build update object only with provided fields
    const updateFields = {};
    if (name)    updateFields.name    = name;
    if (mobile)  updateFields.mobile  = mobile;
    if (address) updateFields.address = address;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true } // Return updated doc; run schema validators
    );

    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    res.status(200).json(
      new ApiResponse(200, user.toSafeObject(), 'Profile updated successfully.')
    );

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Protected
// ─────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Must select password explicitly (select: false in schema)
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return next(new ApiError(400, 'Current password is incorrect.'));
    }

    // Set new password — pre-save hook will hash it automatically
    user.password = newPassword;
    await user.save();

    res.status(200).json(
      new ApiResponse(200, null, 'Password changed successfully.')
    );

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// ADMIN: Get all users
// @route   GET /api/admin/users
// @access  Admin only
// ─────────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const page     = parseInt(req.query.page)  || 1;
    const limit    = parseInt(req.query.limit) || 20;
    const skip     = (page - 1) * limit;
    const search   = req.query.search || '';

    const query = search
      ? { $or: [
          { name:  { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ]}
      : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    res.status(200).json(
      new ApiResponse(200, {
        users,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      }, 'Users fetched successfully.')
    );

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// ADMIN: Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Admin only
// ─────────────────────────────────────────
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return next(new ApiError(400, 'Role must be "user" or "admin".'));
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );

    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    res.status(200).json(
      new ApiResponse(200, user.toSafeObject(), `User role updated to ${role}.`)
    );

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// ADMIN: Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin only
// ─────────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return next(new ApiError(400, 'You cannot delete your own account.'));
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    res.status(200).json(
      new ApiResponse(200, null, 'User deleted successfully.')
    );

  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// ADMIN: Dashboard stats
// @route   GET /api/admin/stats
// @access  Admin only
// ─────────────────────────────────────────
const getAdminStats = async (req, res, next) => {
  try {
    const Order   = require('../models/Order');
    const Product = require('../models/Product');

    const [totalUsers, totalProducts, totalOrders, revenueResult, recentOrders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { orderStatus: 'Delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email'),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    res.status(200).json(
      new ApiResponse(200, {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue,
        recentOrders,
      }, 'Dashboard stats fetched.')
    );

  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminStats,
};
