const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Order = require('../models/order');
const Cart = require('../models/cart');
const Product = require('../models/product');
const { protect, adminOnly } = require('../Auth/auth');

router.use(protect);

// @POST /api/orders — place order
router.post('/', asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, notes } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  // Build order items & validate stock
  const items = [];
  let itemsPrice = 0;

  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) {
      return res.status(400).json({ success: false, message: `Product ${product?.name} is unavailable` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
    }
    items.push({
      product: product._id,
      name: product.name,
      image: product.images[0] || '',
      price: product.price,
      unit: product.unit,
      quantity: item.quantity
    });
    itemsPrice += product.price * item.quantity;
  }

  const shippingPrice = itemsPrice >= 499 ? 0 : 49;
  const taxPrice = Math.round(itemsPrice * 0.05); // 5% GST
  const totalPrice = itemsPrice + shippingPrice + taxPrice;

  const order = await Order.create({
    user: req.user._id,
    items,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    notes,
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    trackingHistory: [{ status: 'pending', message: 'Order placed successfully' }]
  });

  // Deduct stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product._id, { $inc: { stock: -item.quantity } });
  }

  // Clear cart
  await Cart.findOneAndDelete({ user: req.user._id });

  res.status(201).json({ success: true, order });
}));

// @GET /api/orders — my orders
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  res.json({ success: true, orders, total, pages: Math.ceil(total / Number(limit)) });
}));

// @GET /api/orders/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  // Users can only see own orders; admins see all
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  res.json({ success: true, order });
}));

// @PUT /api/orders/:id/cancel — cancel order (user)
router.put('/:id/cancel', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
  }

  order.status = 'cancelled';
  order.trackingHistory.push({ status: 'cancelled', message: 'Order cancelled by customer' });
  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
  await order.save();
  res.json({ success: true, order });
}));

// Admin: update order status
router.put('/:id/status', protect, adminOnly, asyncHandler(async (req, res) => {
  const { status, message } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.status = status;
  order.trackingHistory.push({ status, message: message || `Order ${status}` });
  if (status === 'delivered') {
    order.isPaid = order.paymentMethod === 'cod' ? true : order.isPaid;
    order.paidAt = new Date();
  }
  await order.save();
  res.json({ success: true, order });
}));

module.exports = router;