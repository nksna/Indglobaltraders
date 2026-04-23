const cartRouter = express.Router();
const { Cart } = require('../models/Commerce');
const Product = require('../models/Product');
 
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