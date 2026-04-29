// ── AUTH ROUTES ───────────────────────────────────────────────────
const express = require('express');
const authRouter = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const { protect, generateToken } = require('../Auth/auth');

authRouter.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required' });
  }
  if (await User.findOne({ email })) {
    return res.status(400).json({ success: false, message: 'Email is already registered' });
  }
  const user = await User.create({ name, email, password, phone });
  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
  });
}));
 
// ── POST /api/auth/login ──────────────────────────────────────────────────────
authRouter.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account has been deactivated' });
  }
  res.json({
    success: true,
    token: generateToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role }
  });
}));
 
// ── GET /api/auth/me ──────────────────────────────────────────────────────────
authRouter.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({ success: true, user });
}));
 
// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
// Supports: name, phone, password, avatar
authRouter.put('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
 
  if (req.body.name)   user.name   = req.body.name.trim();
  if (req.body.phone)  user.phone  = req.body.phone.trim();
  if (req.body.avatar) user.avatar = req.body.avatar.trim();
  if (req.body.password && req.body.password.length >= 6) {
    user.password = req.body.password;
  }
 
  const updated = await user.save();
  res.json({
    success: true,
    user: { _id: updated._id, name: updated.name, email: updated.email, phone: updated.phone, avatar: updated.avatar, role: updated.role }
  });
}));
 
// ── POST /api/auth/address ────────────────────────────────────────────────────
authRouter.post('/address', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) {
    user.addresses.forEach(a => (a.isDefault = false));
  }
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
}));
 
// ── DELETE /api/auth/address/:id ──────────────────────────────────────────────
authRouter.delete('/address/:id', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
}));
 
// ── PUT /api/auth/address/:id/default ────────────────────────────────────────
authRouter.put('/address/:id/default', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses.forEach(a => { a.isDefault = a._id.toString() === req.params.id; });
  await user.save();
  res.json({ success: true, addresses: user.addresses });
}));
 

// ── CART ROUTES ───────────────────────────────────────────────────
const cartRouter = express.Router();
// const Cart  = require('../models/cart');

const Product = require('../models/product');
// const { protect }  = require('../Auth/auth');

cartRouter.use(protect);


 
// ── GET /api/cart ─────────────────────────────────────────────────
cartRouter.get('/', asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: 'items.product',
      populate: { path: 'category', select: 'name icon color' }
    });
 
  if (!cart) return res.json({ success: true, items: [], total: 0 });
 
  let total = 0;
  const items = cart.items.map(item => {
    const sub = item.product.price * item.quantity;
    total += sub;
    return { ...item.toObject(), subtotal: sub };
  });
 
  res.json({ success: true, items, total });
}));
 
// ── POST /api/cart — add or update item quantity ──────────────────
cartRouter.post('/', asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
 
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  if (product.stock < quantity) {
    return res.status(400).json({
      success: false,
      message: `Only ${product.stock} units available in stock`
    });
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
  res.json({ success: true, message: 'Cart updated' });
}));
 
// ── DELETE /api/cart/:productId — remove one item ─────────────────
cartRouter.delete('/:productId', asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    await cart.save();
  }
  res.json({ success: true, message: 'Item removed' });
}));
 
// ── DELETE /api/cart — clear entire cart ─────────────────────────
cartRouter.delete('/', asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ success: true, message: 'Cart cleared' });
}));

// ── ORDER ROUTES ──────────────────────────────────────────────────
const orderRouter = express.Router();
const Order = require('../models/order');
const Cart = require('../models/cart');
orderRouter.use(protect);


 
// ── POST /api/orders — place new order ───────────────────────────
orderRouter.post('/', asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, notes } = req.body;
 
  if (!shippingAddress?.fullName || !shippingAddress?.addressLine1) {
    return res.status(400).json({ success: false, message: 'Shipping address is required' });
  }
 
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: 'Your cart is empty' });
  }
 
  // Build order items and validate stock
  const items = [];
  let itemsPrice = 0;
 
  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) {
      return res.status(400).json({ success: false, message: `Product "${product?.name}" is no longer available` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({ success: false, message: `Only ${product.stock} units left for "${product.name}"` });
    }
    items.push({
      product:  product._id,
      name:     product.name,
      icon:     product.icon  || '🛍️',
      image:    product.images?.[0] || '',
      price:    product.price,
      unit:     product.unit,
      quantity: item.quantity
    });
    itemsPrice += product.price * item.quantity;
 
    // Deduct stock immediately
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
  }
 
  const shippingPrice = itemsPrice >= 499 ? 0 : 49;
  const taxPrice      = Math.round(itemsPrice * 0.05);   // 5% GST
  const totalPrice    = itemsPrice + shippingPrice + taxPrice;
 
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
    estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // +3 days
    trackingHistory:   [{ status: 'pending', message: 'Order placed successfully' }]
  });
 
  // Clear cart
  await Cart.findOneAndDelete({ user: req.user._id });
 
  res.status(201).json({ success: true, order });
}));
 
// ── GET /api/orders — my orders ──────────────────────────────────
orderRouter.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments({ user: req.user._id });
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  res.json({ success: true, orders, total, pages: Math.ceil(total / Number(limit)) });
}));
 
// ── GET /api/orders/:id ───────────────────────────────────────────
orderRouter.get('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
 
  // Users can only see their own orders; admins see all
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  res.json({ success: true, order });
}));
 
// ── PUT /api/orders/:id/cancel — user cancels order ──────────────
orderRouter.put('/:id/cancel', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
 
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
  }
 
  order.status = 'cancelled';
  order.trackingHistory.push({ status: 'cancelled', message: 'Cancelled by customer' });
 
  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  }
 
  await order.save();
  res.json({ success: true, order });
}));
 
// ── PUT /api/orders/:id/status — admin updates status ────────────
orderRouter.put('/:id/status', asyncHandler(async (req, res) => {
  const { status, message } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
 
  order.status = status;
  order.trackingHistory.push({ status, message: message || `Order ${status.replace('_', ' ')}` });
 
  if (status === 'delivered') {
    order.isPaid  = true;
    order.paidAt  = new Date();
  }
  await order.save();
  res.json({ success: true, order });
}));

// ── WISHLIST ROUTES ───────────────────────────────────────────────
const wishlistRouter = express.Router();
const Wishlist  = require('../models/wishlist');
// const { protect }  = require('../Auth/auth');
wishlistRouter.use(protect);

// ── GET /api/wishlist ─────────────────────────────────────────────
wishlistRouter.get('/', asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id })
    .populate({
      path: 'products',
      populate: { path: 'category', select: 'name icon color' }
    });
  res.json({ success: true, products: wishlist?.products || [] });
}));
 
// ── POST /api/wishlist/:productId — add to wishlist ───────────────
wishlistRouter.post('/:productId', asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });
 
  const alreadyIn = wishlist.products.map(String).includes(req.params.productId);
  if (!alreadyIn) {
    wishlist.products.push(req.params.productId);
    await wishlist.save();
  }
  res.json({ success: true, message: 'Added to wishlist' });
}));
 
// ── DELETE /api/wishlist/:productId — remove from wishlist ────────
wishlistRouter.delete('/:productId', asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter(p => p.toString() !== req.params.productId);
    await wishlist.save();
  }
  res.json({ success: true, message: 'Removed from wishlist' });
}));

// ── ADMIN ROUTES ──────────────────────────────────────────────────
const adminRouter = express.Router();

// const Order     = require('../models/order');
// const Product      = require('../models/product');
// const Category     = require('../models/category');
// const User         = require('../models/user');
const { adminOnly: isAdmin } = require('../Auth/auth');

adminRouter.use(protect, isAdmin);

adminRouter.get('/stats', asyncHandler(async (req, res) => {
  const [totalOrders, totalProducts, totalUsers, totalCats, revenueAgg] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'user' }),
    Category.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ])
  ]);
 
  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
 
  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);
 
  // Monthly revenue last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyRevenue = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: sixMonthsAgo } } },
    { $group: {
        _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders:  { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
 
  res.json({
    success: true,
    stats: {
      totalOrders, totalProducts, totalUsers, totalCats,
      revenue: revenueAgg[0]?.total || 0,
      ordersByStatus,
      recentOrders,
      monthlyRevenue
    }
  });
}));
 
// ── GET /api/admin/orders — all orders with filters ───────────────
adminRouter.get('/orders', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 30 } = req.query;
  const query = status ? { status } : {};
  const skip  = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  res.json({ success: true, orders, total, pages: Math.ceil(total / Number(limit)) });
}));
 
// ── PUT /api/admin/orders/:id/status — update order status ────────
adminRouter.put('/orders/:id/status', asyncHandler(async (req, res) => {
  const { status, message } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
 
  order.status = status;
  order.trackingHistory.push({ status, message: message || `Order ${status.replace('_', ' ')}` });
  if (status === 'delivered') { order.isPaid = true; order.paidAt = new Date(); }
  await order.save();
  res.json({ success: true, order });
}));
 
// ── GET /api/admin/users — all customers ─────────────────────────
adminRouter.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'user' })
    .select('-password')
    .sort({ createdAt: -1 });
  res.json({ success: true, users });
}));
 
// ── PUT /api/admin/users/:id/toggle — activate or deactivate user ─
adminRouter.put('/users/:id/toggle', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
}));
 
// ── GET /api/admin/low-stock — products with stock < 10 ──────────
adminRouter.get('/low-stock', asyncHandler(async (req, res) => {
  const products = await Product.find({ stock: { $lt: 10 }, isActive: true })
    .populate('category', 'name icon')
    .sort({ stock: 1 });
  res.json({ success: true, products });
}));
 
// ── GET /api/admin/revenue — monthly revenue chart data ──────────
adminRouter.get('/revenue', asyncHandler(async (req, res) => {
  const months = Number(req.query.months) || 6;
  const since  = new Date();
  since.setMonth(since.getMonth() - months);
 
  const data = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: since } } },
    { $group: {
        _id:     { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders:  { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);
  res.json({ success: true, data });
}));

// Payment
const paymentRouter = express.Router();
const crypto = require('crypto');
// const Order   = require('../models/order');
// const { protect }  = require('../Auth/auth');
paymentRouter.use(protect);

paymentRouter.post('/create-order', asyncHandler(async (req, res) => {
  const Razorpay = require('razorpay');
  const rzp = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
 
  const order = await Order.findById(req.body.orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
 
  const rzpOrder = await rzp.orders.create({
    amount:   Math.round(order.totalPrice * 100),  // paise
    currency: 'INR',
    receipt:  order.orderNumber
  });
 
  order.paymentResult = { razorpay_order_id: rzpOrder.id, status: 'created' };
  await order.save();
 
  res.json({
    success:        true,
    razorpayOrderId:rzpOrder.id,
    amount:         rzpOrder.amount,
    currency:       'INR',
    keyId:          process.env.RAZORPAY_KEY_ID
  });
}));
 
// ── POST /api/payment/verify ──────────────────────────────────────
// Verifies Razorpay signature after payment
paymentRouter.post('/verify', asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
 
  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');
 
  if (generated !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed' });
  }
 
  const order = await Order.findById(orderId);
  order.isPaid        = true;
  order.paidAt        = new Date();
  order.status        = 'confirmed';
  order.paymentResult = { razorpay_order_id, razorpay_payment_id, razorpay_signature, status: 'paid' };
  order.trackingHistory.push({ status: 'confirmed', message: 'Payment received & order confirmed' });
  await order.save();
 
  res.json({ success: true, message: 'Payment verified', order });
}));

module.exports = { authRouter, cartRouter, orderRouter, wishlistRouter, adminRouter, paymentRouter };