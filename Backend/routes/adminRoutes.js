const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Order = require('../models/order');
const Product = require('../models/product');
const User = require('../models/user');
const { protect, adminOnly } = require('../Auth/auth');

router.use(protect, adminOnly);

// @GET /api/admin/stats — dashboard summary
router.get('/stats', asyncHandler(async (req, res) => {
  const [totalOrders, totalProducts, totalUsers, revenueAgg] = await Promise.all([
    Order.countDocuments(),
    Product.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'user' }),
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ])
  ]);

  const revenue = revenueAgg[0]?.total || 0;

  const ordersByStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const recentOrders = await Order.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(10);

  const topProducts = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.product', name: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' } } },
    { $sort: { totalSold: -1 } },
    { $limit: 5 }
  ]);

  // Monthly revenue (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyRevenue = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, revenue: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  res.json({ success: true, stats: { totalOrders, totalProducts, totalUsers, revenue, ordersByStatus, recentOrders, topProducts, monthlyRevenue } });
}));

// @GET /api/admin/orders — all orders
router.get('/orders', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const query = status ? { status } : {};
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Order.countDocuments(query);
  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));
  res.json({ success: true, orders, total, pages: Math.ceil(total / Number(limit)) });
}));

// @GET /api/admin/users — all users
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
  res.json({ success: true, users });
}));

// @PUT /api/admin/users/:id/toggle — activate/deactivate user
router.put('/users/:id/toggle', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
}));

// @GET /api/admin/low-stock — products with stock < 10
router.get('/low-stock', asyncHandler(async (req, res) => {
  const products = await Product.find({ stock: { $lt: 10 }, isActive: true }).sort({ stock: 1 });
  res.json({ success: true, products });
}));

module.exports = router;