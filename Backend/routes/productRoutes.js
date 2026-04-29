const express      = require('express');
const router       = express.Router();
const asyncHandler = require('express-async-handler');
const Product      = require('../models/product');
const { protect, adminOnly } = require('../Auth/auth');

// ── GET /api/products ─────────────────────────────────────────────
// Query params: keyword, category, minPrice, maxPrice, sort, page, limit, featured
router.get('/', asyncHandler(async (req, res) => {
  const {
    keyword, category, minPrice, maxPrice,
    sort, page = 1, limit = 16, featured
  } = req.query;

  const query = { isActive: true };

  // Improved search: text index first, fallback to regex
  if (keyword && keyword.trim()) {
    const kw = keyword.trim();
    // Try text search for ranking, fallback to regex
    query.$or = [
      { name:        { $regex: kw, $options: 'i' } },
      { description: { $regex: kw, $options: 'i' } },
      { brand:       { $regex: kw, $options: 'i' } },
      { tags:        { $regex: kw, $options: 'i' } }
    ];
  }

  if (category) query.category = category;
  if (featured === 'true') query.isFeatured = true;

  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
    rating:     { rating: -1 },
    newest:     { createdAt: -1 },
    discount:   { discount: -1 }
  };
  const sortOpt = sortMap[sort] || { createdAt: -1 };

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [total, products] = await Promise.all([
    Product.countDocuments(query),
    Product.find(query)
      .populate('category', 'name icon color slug')
      .sort(sortOpt)
      .skip(skip)
      .limit(limitNum)
  ]);

  res.json({
    success: true,
    products,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    total
  });
}));

// ── GET /api/products/search-suggestions ─────────────────────────
// Lightweight endpoint for real-time search dropdown (5 results max)
router.get('/suggestions', asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) return res.json({ success: true, suggestions: [] });
  const products = await Product.find({
    isActive: true,
    $or: [
      { name:  { $regex: q.trim(), $options: 'i' } },
      { brand: { $regex: q.trim(), $options: 'i' } },
      { tags:  { $regex: q.trim(), $options: 'i' } }
    ]
  })
  .populate('category', 'name icon')
  .select('name price images icon category unit')
  .limit(6);

  res.json({ success: true, suggestions: products });
}));

// ── GET /api/products/:id ─────────────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category', 'name icon color slug');
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, product });
}));

// ── POST /api/products/:id/reviews ────────────────────────────────
router.post('/:id/reviews', protect, asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || !comment) {
    return res.status(400).json({ success: false, message: 'Rating and comment are required' });
  }
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  const already = product.reviews.find(r => r.user.toString() === req.user._id.toString());
  if (already) return res.status(400).json({ success: false, message: 'You have already reviewed this product' });

  product.reviews.push({
    user:    req.user._id,
    name:    req.user.name,
    rating:  Number(rating),
    comment: comment.trim()
  });
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
  await product.save();
  res.status(201).json({ success: true, message: 'Review added' });
}));

// ── POST /api/products — admin create ────────────────────────────
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  const populated = await product.populate('category', 'name icon color slug');
  res.status(201).json({ success: true, product: populated });
}));

// ── PUT /api/products/:id — admin update ─────────────────────────
router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('category', 'name icon color slug');

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
}));

// ── DELETE /api/products/:id — admin soft delete ─────────────────
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Product deactivated' });
}));

module.exports = router;