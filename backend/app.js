// ============================================================
// app.js
// Express application setup — middleware, routes, error handlers
// Exported for use in server.js (separation of concerns)
// ============================================================

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// ──────────────────────────────────────────────────
// CORS — Allow requests from your HTML frontend
// In development: VS Code Live Server (port 5500) or file://
// In production: replace with your deployed frontend URL
// ──────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://shopease1-frontend-nyaf.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS blocked'));
    }
  },
  credentials: true
}));

// ──────────────────────────────────────────────────
// BODY PARSERS
// ──────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));           // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse form-encoded bodies

// ──────────────────────────────────────────────────
// REQUEST LOGGER — only in development
// ──────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ──────────────────────────────────────────────────
// STATIC FILES — serve uploaded product images
// Access via: https://shopease1-backend-vit4.onrender.com/uploads/<filename>
// ──────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ──────────────────────────────────────────────────
// HEALTH CHECK — quick ping to verify server is up
// ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ShopEase API is running 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ──────────────────────────────────────────────────
// API ROUTES
// ──────────────────────────────────────────────────
app.use('/api/auth', authRoutes);    // Authentication & user management
app.use('/api/products', productRoutes); // Product CRUD
app.use('/api/orders', orderRoutes);   // Order management
app.use('/api/payments', paymentRoutes); // Payment tracking
app.use('/api/reviews', reviewRoutes);  // Product reviews

// ──────────────────────────────────────────────────
// ERROR HANDLERS (must be registered AFTER routes)
// ──────────────────────────────────────────────────
app.use(notFound);     // 404 for unmatched routes
app.use(errorHandler); // Centralized error response

module.exports = app;
