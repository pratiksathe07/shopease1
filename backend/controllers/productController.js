// ============================================================
// controllers/productController.js
// Handles: Get all, Get one, Create, Update, Delete products
// ============================================================

const Product     = require('../models/Product');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');
const multer      = require('multer');
const path        = require('path');
const fs          = require('fs');

// ─── Multer config for product image uploads ───
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype) ? cb(null, true) : cb(new ApiError(400, 'Only JPEG, PNG, and WebP images allowed.'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Wrap multer so it's optional — skip if content-type is JSON (URL-based images)
const uploadImages = (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('application/json') || ct.includes('application/x-www-form-urlencoded')) {
    return next(); // No files to upload — JSON body already parsed by express
  }
  upload.array('images', 5)(req, res, next);
};

// GET /api/products — Public — search, filter, paginate
const getAllProducts = async (req, res, next) => {
  try {
    const { search, category, minPrice, maxPrice, sort = '-createdAt', page = 1, limit = 12 } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name:        { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand:       { $regex: search, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const sortMap = {
      '-createdAt': { createdAt: -1 },
      'price_asc':  { price: 1 },
      'price_desc': { price: -1 },
      'rating':     { 'rating.average': -1 },
      'name':       { name: 1 },
    };
    const sortQuery = sortMap[sort] || sortMap['-createdAt'];

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sortQuery).skip(skip).limit(limitNum),
      Product.countDocuments(filter),
    ]);

    res.status(200).json(new ApiResponse(200, {
      products,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    }, 'Products fetched successfully.'));
  } catch (error) { next(error); }
};

// GET /api/products/categories — Public
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.status(200).json(new ApiResponse(200, categories, 'Categories fetched.'));
  } catch (error) { next(error); }
};

// GET /api/products/:id — Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) return next(new ApiError(404, 'Product not found.'));
    res.status(200).json(new ApiResponse(200, product, 'Product fetched successfully.'));
  } catch (error) { next(error); }
};

// POST /api/products — Admin only
const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, brand, price, stock } = req.body;
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((f) => `/uploads/${f.filename}`);
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }
    const product = await Product.create({ name, description, category, brand, price: Number(price), stock: Number(stock) || 0, images });
    res.status(201).json(new ApiResponse(201, product, 'Product created successfully.'));
  } catch (error) { next(error); }
};

// PUT /api/products/:id — Admin only
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, category, brand, price, stock, isActive } = req.body;
    const updateFields = {};
    if (name        !== undefined) updateFields.name        = name;
    if (description !== undefined) updateFields.description = description;
    if (category    !== undefined) updateFields.category    = category;
    if (brand       !== undefined) updateFields.brand       = brand;
    if (price       !== undefined) updateFields.price       = Number(price);
    if (stock       !== undefined) updateFields.stock       = Number(stock);
    if (isActive    !== undefined) updateFields.isActive    = isActive;
    if (req.files && req.files.length > 0) {
      updateFields.images = req.files.map((f) => `/uploads/${f.filename}`);
    } else if (req.body.images) {
      updateFields.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }
    const product = await Product.findByIdAndUpdate(req.params.id, { $set: updateFields }, { new: true, runValidators: true });
    if (!product) return next(new ApiError(404, 'Product not found.'));
    res.status(200).json(new ApiResponse(200, product, 'Product updated successfully.'));
  } catch (error) { next(error); }
};

// DELETE /api/products/:id — Admin only (soft delete)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return next(new ApiError(404, 'Product not found.'));
    res.status(200).json(new ApiResponse(200, null, 'Product deleted successfully.'));
  } catch (error) { next(error); }
};

module.exports = { uploadImages, getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getCategories };
