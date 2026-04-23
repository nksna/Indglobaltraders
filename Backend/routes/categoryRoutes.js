const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Category = require('../models/category');
const Product = require('../models/product');
const { protect, adminOnly } = require('../auth/auth');

// @GET /api/categories — all active categories (public)
router.get('/', asyncHandler(async (req, res) => {
  const cats = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
  // attach product count to each
  const withCounts = await Promise.all(
    cats.map(async (c) => {
      const count = await Product.countDocuments({ category: c._id, isActive: true });
      return { ...c.toObject(), productCount: count };
    })
  );
  res.json({ success: true, categories: withCounts });
}));

// @GET /api/categories/all — include inactive (admin)
router.get('/all', protect, adminOnly, asyncHandler(async (req, res) => {
  const cats = await Category.find().sort({ sortOrder: 1, name: 1 });
  const withCounts = await Promise.all(
    cats.map(async (c) => {
      const count = await Product.countDocuments({ category: c._id });
      return { ...c.toObject(), productCount: count };
    })
  );
  res.json({ success: true, categories: withCounts });
}));

// @GET /api/categories/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const cat = await Category.findById(req.params.id);
  if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, category: cat });
}));

// @POST /api/categories — admin create
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { name, icon, color, description, sortOrder, parent } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

  const exists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
  if (exists) return res.status(400).json({ success: false, message: 'Category already exists' });

  const category = await Category.create({ name, icon, color, description, sortOrder, parent });
  res.status(201).json({ success: true, category });
}));

// @PUT /api/categories/:id — admin update
router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, category });
}));

// @DELETE /api/categories/:id — admin soft delete
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const count = await Product.countDocuments({ category: req.params.id, isActive: true });
  if (count > 0) {
    return res.status(400).json({ success: false, message: `Cannot delete: ${count} active products use this category` });
  }
  await Category.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ success: true, message: 'Category deactivated' });
}));

module.exports = router;