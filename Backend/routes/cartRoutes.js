const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Cart = require('../models/cart');
const Product = require('../models/product');
const { protect } = require('../Auth/auth');

// All cart routes require auth
router.use(protect);

// @GET /api/cart
router.get('/', asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) return res.json({ success: true, items: [], total: 0 });

  let total = 0;
  const items = cart.items.map(item => {
    const subtotal = item.product.price * item.quantity;
    total += subtotal;
    return { ...item.toObject(), subtotal };
  });

  res.json({ success: true, items, total });
}));

// @POST /api/cart — add or update item
router.post('/', asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  if (product.stock < quantity) {
    return res.status(400).json({ success: false, message: 'Insufficient stock' });
  }

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });

  const idx = cart.items.findIndex(i => i.product.toString() === productId);
  if (idx > -1) {
    cart.items[idx].quantity = quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();
  const updated = await Cart.findOne({ user: req.user._id }).populate('items.product');
  res.json({ success: true, cart: updated });
}));

// @DELETE /api/cart/:productId
router.delete('/:productId', asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

  cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
  await cart.save();
  res.json({ success: true, message: 'Item removed' });
}));

// @DELETE /api/cart — clear cart
router.delete('/', asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ success: true, message: 'Cart cleared' });
}));

module.exports = router;