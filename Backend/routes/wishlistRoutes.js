const wishlistRouter = express.Router();
const { Wishlist } = require('../models/Commerce');
 
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