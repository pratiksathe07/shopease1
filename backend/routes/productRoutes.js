// ============================================================
// routes/productRoutes.js
// Product CRUD routes — Public GET, Admin POST/PUT/DELETE
// Images stored in MongoDB are served via GET /images/:imageId
// ============================================================

const express = require('express');
const router  = express.Router();

const {
  uploadImages,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  serveImage,
} = require('../controllers/productController');

const { protect }   = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { productValidation, validateRequest } = require('../middleware/validateMiddleware');

// ── Public ──────────────────────────────────────────────────
router.get('/',                   getAllProducts);
router.get('/categories',         getCategories);
router.get('/images/:imageId',    serveImage);   // Serve MongoDB-stored images
router.get('/:id',                getProductById);

// ── Admin only ──────────────────────────────────────────────
router.post('/',    protect, adminOnly, uploadImages, productValidation, validateRequest, createProduct);
router.put('/:id',  protect, adminOnly, uploadImages, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

module.exports = router;
