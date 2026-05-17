// ============================================================
// models/User.js
// Mongoose schema for Users collection
// Handles: register, login, profile, role-based access
// ============================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  street:  { type: String, trim: true },
  city:    { type: String, trim: true },
  state:   { type: String, trim: true },
  pincode: { type: String, trim: true },
  country: { type: String, trim: true, default: 'India' },
}, { _id: false }); // No separate _id for embedded address

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [50, 'Name must be at most 50 characters'],
    },

    email: {
      type:     String,
      required: [true, 'Email is required'],
      unique:   true,
      lowercase: true,
      trim:     true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
        'Please enter a valid email address',
      ],
    },

    mobile: {
      type:  String,
      trim:  true,
      match: [/^[6-9][0-9]{9}$/, 'Enter a valid 10-digit Indian mobile number'],
    },

    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false, // Never returned in queries by default (security)
    },

    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },

    address: addressSchema,

    // Optional fields for future use
    avatar:    { type: String, default: '' },
    isActive:  { type: Boolean, default: true },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ──────────────────────────────────────────────────
// PRE-SAVE HOOK: Hash password before saving to DB
// Only runs if the password field was modified
// ──────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); // Skip if password unchanged

  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// ──────────────────────────────────────────────────
// INSTANCE METHOD: Compare entered password with hashed DB password
// Usage: const isMatch = await user.comparePassword(enteredPassword)
// ──────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ──────────────────────────────────────────────────
// INSTANCE METHOD: Return user data without sensitive fields
// Usage: user.toSafeObject() — returns plain JS object
// ──────────────────────────────────────────────────
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
