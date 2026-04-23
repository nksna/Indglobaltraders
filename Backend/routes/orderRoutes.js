const orderRouter = express.Router();
const { Order } = require('../models/order');
 
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