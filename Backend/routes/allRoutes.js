// ── AUTH ROUTES ───────────────────────────────────────────────────
const express = require('express');
const authRouter = express.Router();
const asyncHandler = require('express-async-handler');
const User = require('../models/user');
const { protect, generateToken } = require('../Auth/auth');

authRouter.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password required' });
  if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });
  const user = await User.create({ name, email, password, phone });
  res.status(201).json({ success: true, token: generateToken(user._id), user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
}));

authRouter.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ success: false, message: 'Invalid email or password' });
  if (!user.isActive) return res.status(401).json({ success: false, message: 'Account deactivated' });
  res.json({ success: true, token: generateToken(user._id), user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
}));

authRouter.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({ success: true, user: await User.findById(req.user._id).select('-password') });
}));

authRouter.put('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  if (req.body.password) user.password = req.body.password;
  await user.save();
  res.json({ success: true, user: { _id: user._id, name: user.name, email: user.email, phone: user.phone } });
}));

authRouter.post('/address', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) user.addresses.forEach(a => (a.isDefault = false));
  user.addresses.push(req.body);
  await user.save();
  res.status(201).json({ success: true, addresses: user.addresses });
}));

authRouter.delete('/address/:id', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
  await user.save();
  res.json({ success: true, addresses: user.addresses });
}));

// ── CART ROUTES ───────────────────────────────────────────────────
const cartRouter = express.Router();
const Cart  = require('../models/cart');
const Product = require('../models/product');

cartRouter.use(protect);

cartRouter.get('/', asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate({ path: 'items.product', populate: { path: 'category', select: 'name icon color' } });
  if (!cart) return res.json({ success: true, items: [], total: 0 });
  let total = 0;
  const items = cart.items.map(item => { const sub = item.product.price * item.quantity; total += sub; return { ...item.toObject(), subtotal: sub }; });
  res.json({ success: true, items, total });
}));

cartRouter.post('/', asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);
  if (!product?.isActive) return res.status(404).json({ success: false, message: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });
  let cart = await Cart.findOne({ user: req.user._id }) || new Cart({ user: req.user._id, items: [] });
  const idx = cart.items.findIndex(i => i.product.toString() === productId);
  if (idx > -1) cart.items[idx].quantity = quantity; else cart.items.push({ product: productId, quantity });
  await cart.save();
  res.json({ success: true });
}));

cartRouter.delete('/:productId', asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) { cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId); await cart.save(); }
  res.json({ success: true });
}));

cartRouter.delete('/', asyncHandler(async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ success: true });
}));

// ── ORDER ROUTES ──────────────────────────────────────────────────
const orderRouter = express.Router();
const Order = require('../models/order');

orderRouter.use(protect);

orderRouter.post('/', asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod, notes } = req.body;
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart?.items.length) return res.status(400).json({ success: false, message: 'Cart is empty' });
  const items = []; let itemsPrice = 0;
  for (const item of cart.items) {
    const p = item.product;
    if (!p?.isActive) return res.status(400).json({ success: false, message: `Product ${p?.name} unavailable` });
    if (p.stock < item.quantity) return res.status(400).json({ success: false, message: `Insufficient stock for ${p.name}` });
    items.push({ product: p._id, name: p.name, icon: p.icon, price: p.price, unit: p.unit, quantity: item.quantity });
    itemsPrice += p.price * item.quantity;
    await Product.findByIdAndUpdate(p._id, { $inc: { stock: -item.quantity } });
  }
  const shippingPrice = itemsPrice >= 499 ? 0 : 49;
  const taxPrice = Math.round(itemsPrice * 0.05);
  const order = await Order.create({ user: req.user._id, items, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice: itemsPrice + shippingPrice + taxPrice, notes, estimatedDelivery: new Date(Date.now() + 3 * 86400000), trackingHistory: [{ status: 'pending', message: 'Order placed successfully' }] });
  await Cart.findOneAndDelete({ user: req.user._id });
  res.status(201).json({ success: true, order });
}));

orderRouter.get('/', asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
}));

orderRouter.get('/:id', asyncHandler(async (req, res) => {
  const { adminOnly } = require('../middleware/auth');
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Access denied' });
  res.json({ success: true, order });
}));

orderRouter.put('/:id/cancel', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || order.user.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Access denied' });
  if (!['pending', 'confirmed'].includes(order.status)) return res.status(400).json({ success: false, message: 'Cannot cancel at this stage' });
  order.status = 'cancelled';
  order.trackingHistory.push({ status: 'cancelled', message: 'Cancelled by customer' });
  for (const item of order.items) await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
  await order.save();
  res.json({ success: true, order });
}));

// ── WISHLIST ROUTES ───────────────────────────────────────────────
const wishlistRouter = express.Router();
const Wishlist  = require('../models/wishlist');

wishlistRouter.use(protect);

wishlistRouter.get('/', asyncHandler(async (req, res) => {
  const w = await Wishlist.findOne({ user: req.user._id }).populate({ path: 'products', populate: { path: 'category', select: 'name icon color' } });
  res.json({ success: true, products: w?.products || [] });
}));

wishlistRouter.post('/:id', asyncHandler(async (req, res) => {
  let w = await Wishlist.findOne({ user: req.user._id }) || new Wishlist({ user: req.user._id, products: [] });
  if (!w.products.includes(req.params.id)) { w.products.push(req.params.id); await w.save(); }
  res.json({ success: true });
}));

wishlistRouter.delete('/:id', asyncHandler(async (req, res) => {
  const w = await Wishlist.findOne({ user: req.user._id });
  if (w) { w.products = w.products.filter(p => p.toString() !== req.params.id); await w.save(); }
  res.json({ success: true });
}));

// ── ADMIN ROUTES ──────────────────────────────────────────────────
const adminRouter = express.Router();
const { adminOnly: isAdmin } = require('../Auth/auth');

adminRouter.use(protect, isAdmin);

adminRouter.get('/stats', asyncHandler(async (req, res) => {
  const [totalOrders, totalProducts, totalUsers, revAgg, totalCats] = await Promise.all([
    Order.countDocuments(), Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'user' }),
    Order.aggregate([{ $match: { isPaid: true } }, { $group: { _id: null, total: { $sum: '$totalPrice' } } }]),
    require('../models/Category').countDocuments({ isActive: true })
  ]);
  const recentOrders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(10);
  const ordersByStatus = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  res.json({ success: true, stats: { totalOrders, totalProducts, totalUsers, totalCats, revenue: revAgg[0]?.total || 0, recentOrders, ordersByStatus } });
}));

adminRouter.get('/orders', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = status ? { status } : {};
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query).populate('user', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
  res.json({ success: true, orders, total });
}));

adminRouter.put('/orders/:id/status', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Not found' });
  order.status = req.body.status;
  order.trackingHistory.push({ status: req.body.status, message: req.body.message || `Order ${req.body.status}` });
  if (req.body.status === 'delivered') { order.isPaid = true; order.paidAt = new Date(); }
  await order.save();
  res.json({ success: true, order });
}));

adminRouter.get('/users', asyncHandler(async (req, res) => {
  res.json({ success: true, users: await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 }) });
}));

adminRouter.put('/users/:id/toggle', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  user.isActive = !user.isActive; await user.save();
  res.json({ success: true });
}));

adminRouter.get('/low-stock', asyncHandler(async (req, res) => {
  res.json({ success: true, products: await Product.find({ stock: { $lt: 10 }, isActive: true }).populate('category', 'name').sort({ stock: 1 }) });
}));

// Payment
const paymentRouter = express.Router();
const crypto = require('crypto');
paymentRouter.use(protect);

paymentRouter.post('/create-order', asyncHandler(async (req, res) => {
  const Razorpay = require('razorpay');
  const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  const order = await Order.findById(req.body.orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  const rzOrder = await rz.orders.create({ amount: Math.round(order.totalPrice * 100), currency: 'INR', receipt: order.orderNumber });
  order.paymentResult = { razorpay_order_id: rzOrder.id, status: 'created' };
  await order.save();
  res.json({ success: true, razorpayOrderId: rzOrder.id, amount: rzOrder.amount, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID });
}));

paymentRouter.post('/verify', asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  const sig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
  if (sig !== razorpay_signature) return res.status(400).json({ success: false, message: 'Verification failed' });
  const order = await Order.findById(orderId);
  order.isPaid = true; order.paidAt = new Date(); order.status = 'confirmed';
  order.paymentResult = { razorpay_order_id, razorpay_payment_id, razorpay_signature, status: 'paid' };
  order.trackingHistory.push({ status: 'confirmed', message: 'Payment received' });
  await order.save();
  res.json({ success: true, order });
}));

module.exports = { authRouter, cartRouter, orderRouter, wishlistRouter, adminRouter, paymentRouter };