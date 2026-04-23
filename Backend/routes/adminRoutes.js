const adminRouter = express.Router();
const { adminOnly: isAdmin } = require('../middleware/auth');
 
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
