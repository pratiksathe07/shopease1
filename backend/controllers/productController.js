// ============================================================
// controllers/productController.js
// Handles: Get all, Get one, Create, Update, Delete products
// Images are stored in MongoDB (Image collection) instead of disk
// so they persist across server redeploys on Render / Heroku etc.
// ============================================================

const Product     = require('../models/Product');
const Image       = require('../models/Image');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');
const multer      = require('multer');

// ─── Multer: memory storage (no disk writes) ───────────────
// Files are held in RAM as Buffer objects (req.files[].buffer)
// We then convert them to Base64 and save in MongoDB.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  allowed.includes(file.mimetype)
    ? cb(null, true)
    : cb(new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per image
});

// ── Middleware: parse multipart OR skip for JSON requests ──
const uploadImages = (req, res, next) => {
  const ct = req.headers['content-type'] || '';
  if (ct.includes('application/json') || ct.includes('application/x-www-form-urlencoded')) {
    return next(); // JSON body already parsed by Express — no files
  }
  upload.array('images', 5)(req, res, next);
};

// ── Helper: save uploaded files to MongoDB Image collection ──
// Returns array of MongoDB ObjectIDs (strings)
const saveImagesToMongo = async (files, userId) => {
  const ids = [];
  for (const file of files) {
    // Convert Buffer → Base64 data URI
    const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const imgDoc = await Image.create({
      data:        base64,
      contentType: file.mimetype,
      filename:    file.originalname,
      size:        file.size,
      uploadedBy:  userId || null,
    });
    ids.push(imgDoc._id.toString());
  }
  return ids;
};

// ══════════════════════════════════════════════════════════
// GET /api/products/images/:imageId — Public
// Serve an image stored in MongoDB by its ObjectID.
// The frontend uses this URL as the <img src="..."> value.
// ══════════════════════════════════════════════════════════
const serveImage = async (req, res, next) => {
  try {
    const img = await Image.findById(req.params.imageId);
    if (!img) return next(new ApiError(404, 'Image not found.'));

    // img.data is "data:<type>;base64,<payload>"
    const matches = img.data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return next(new ApiError(500, 'Corrupt image data.'));

    const [, mimeType, base64Data] = matches;
    const buffer = Buffer.from(base64Data, 'base64');

    res.set('Content-Type', mimeType);
    res.set('Content-Length', buffer.length);
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.send(buffer);
  } catch (error) { next(error); }
};

// ══════════════════════════════════════════════════════════
// GET /api/products — Public — search, filter, paginate
// ══════════════════════════════════════════════════════════
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

// ══════════════════════════════════════════════════════════
// GET /api/products/categories — Public
// ══════════════════════════════════════════════════════════
const getCategories = async (req, res, next) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.status(200).json(new ApiResponse(200, categories, 'Categories fetched.'));
  } catch (error) { next(error); }
};

// ══════════════════════════════════════════════════════════
// GET /api/products/:id — Public
// ══════════════════════════════════════════════════════════
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) return next(new ApiError(404, 'Product not found.'));
    res.status(200).json(new ApiResponse(200, product, 'Product fetched successfully.'));
  } catch (error) { next(error); }
};

// ══════════════════════════════════════════════════════════
// POST /api/products — Admin only
// Accepts either:
//   - multipart/form-data with image files  → saved to MongoDB
//   - JSON body with { images: ["url1",...] } → stored as-is (external URLs)
// ══════════════════════════════════════════════════════════
const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, brand, price, stock } = req.body;
    let images = [];

    if (req.files && req.files.length > 0) {
      // Files uploaded via multipart — save to MongoDB
      images = await saveImagesToMongo(req.files, req.user?._id);
      // Convert ObjectIDs to API URLs so the frontend can use them directly
      images = images.map((id) => `/api/products/images/${id}`);
    } else if (req.body.images) {
      // External URLs provided in JSON body (e.g. Unsplash links)
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const product = await Product.create({
      name,
      description,
      category,
      brand,
      price:  Number(price),
      stock:  Number(stock) || 0,
      images,
    });

    res.status(201).json(new ApiResponse(201, product, 'Product created successfully.'));
  } catch (error) { next(error); }
};

// ══════════════════════════════════════════════════════════
// PUT /api/products/:id — Admin only
// ══════════════════════════════════════════════════════════
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
      // New files uploaded — save to MongoDB and replace images array
      let imageIds = await saveImagesToMongo(req.files, req.user?._id);
      updateFields.images = imageIds.map((id) => `/api/products/images/${id}`);
    } else if (req.body.images) {
      // External URLs provided in JSON body
      updateFields.images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );
    if (!product) return next(new ApiError(404, 'Product not found.'));
    res.status(200).json(new ApiResponse(200, product, 'Product updated successfully.'));
  } catch (error) { next(error); }
};

// ══════════════════════════════════════════════════════════
// DELETE /api/products/:id — Admin only (soft delete)
// ══════════════════════════════════════════════════════════
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) return next(new ApiError(404, 'Product not found.'));
    res.status(200).json(new ApiResponse(200, null, 'Product deleted successfully.'));
  } catch (error) { next(error); }
};

module.exports = {
  uploadImages,
  getAllProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  serveImage,
};
