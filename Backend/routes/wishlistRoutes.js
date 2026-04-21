const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Wishlist = require('../models/wishlist');
const { protect } = require('../Auth/auth');

router.use(protect);

router.get('/', asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
  res.json({ success: true, products: wishlist?.products || [] });
}));

router.post('/:productId', asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });

  if (!wishlist.products.includes(req.params.productId)) {
    wishlist.products.push(req.params.productId);
    await wishlist.save();
  }
  res.json({ success: true, message: 'Added to wishlist' });
}));

router.delete('/:productId', asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter(p => p.toString() !== req.params.productId);
    await wishlist.save();
  }
  res.json({ success: true, message: 'Removed from wishlist' });
}));

module.exports = router;