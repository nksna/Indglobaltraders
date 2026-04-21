const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Product = require('../models/product');
const { protect, adminOnly } = require('../Auth/auth');

// @GET /api/products — list with filters/search/pagination
router.get('/', asyncHandler(async (req, res) => {
  const { keyword, category, minPrice, maxPrice, sort, page = 1, limit = 12, featured } = req.query;

  const query = { isActive: true };
  if (keyword) query.name = { $regex: keyword, $options: 'i' };
  if (category) query.category = category;
  if (featured === 'true') query.isFeatured = true;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
    newest: { createdAt: -1 }
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(query);
  const products = await Product.find(query).sort(sortOption).skip(skip).limit(Number(limit));

  res.json({
    success: true,
    products,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    total
  });
}));

// @GET /api/products/categories
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  res.json({ success: true, categories });
}));

// @GET /api/products/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, product });
}));

// @POST /api/products/:id/reviews
router.post('/:id/reviews', protect, asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const already = product.reviews.find(r => r.user.toString() === req.user._id.toString());
  if (already) return res.status(400).json({ success: false, message: 'Already reviewed' });

  product.reviews.push({ user: req.user._id, name: req.user.name, rating: Number(rating), comment });
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;
  await product.save();
  res.status(201).json({ success: true, message: 'Review added' });
}));

// Admin: Create product
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
}));

// Admin: Update product
router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
}));

// Admin: Delete product (soft delete)
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Product deactivated' });
}));

module.exports = router;