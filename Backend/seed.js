/**
 * seed.js — populate the database with categories and products
 * Run: npm run seed
 */
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const dotenv   = require('dotenv');
dotenv.config();

const User     = require('./models/user');
const Category = require('./models/category');
const Product  = require('./models/product');

// ── CATEGORIES ────────────────────────────────────────────────────
const categories = [
  { name: 'Groceries & Food',   icon: '🛒', color: '#16a34a', description: 'Fresh farm produce, pantry staples & daily essentials', sortOrder: 1 },
  { name: 'Dress & Fashion',    icon: '👗', color: '#db2777', description: 'Clothing, ethnic wear & accessories for all',           sortOrder: 2 },
  { name: 'Gifts & Occasions',  icon: '🎁', color: '#9333ea', description: 'Curated gift hampers, decor & celebration essentials',  sortOrder: 3 },
  { name: 'Home & Kitchen',     icon: '🏠', color: '#ea580c', description: 'Cookware, appliances & home décor',                    sortOrder: 4 },
  { name: 'Health & Beauty',    icon: '💄', color: '#e11d48', description: 'Skincare, wellness & personal care products',           sortOrder: 5 },
  { name: 'Electronics',        icon: '📱', color: '#2563eb', description: 'Gadgets, accessories & smart devices',                 sortOrder: 6 },
];

// ── PRODUCTS — with real Unsplash image URLs ───────────────────────
// Note: You can replace these with your own Cloudinary / S3 URLs
const buildProducts = (catMap) => [

  // ── Groceries & Food ─────────────────────────────────────────────
  {
    name: 'Sona Masoori Rice', category: catMap['Groceries & Food'],
    price: 65, mrp: 80, unit: '1 kg', stock: 200,
    icon: '🌾', isFeatured: true, brand: 'Farm Fresh',
    images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80'],
    description: 'Premium quality Sona Masoori rice sourced directly from Andhra Pradesh farms. Light, fluffy, and perfect for everyday cooking.',
    tags: ['rice', 'staple', 'south-indian']
  },
  {
    name: 'Toor Dal (Arhar)', category: catMap['Groceries & Food'],
    price: 140, mrp: 165, unit: '1 kg', stock: 180,
    icon: '🫘', isFeatured: true, brand: 'Farm Fresh',
    images: ['https://images.unsplash.com/photo-1612966809892-fe4ff93e6a72?w=400&q=80'],
    description: 'Protein-rich toor dal, essential for sambar and everyday dal preparations.',
    tags: ['dal', 'protein', 'lentil']
  },
  {
    name: 'Pure Cow Ghee', category: catMap['Groceries & Food'],
    price: 550, mrp: 650, unit: '500 ml', stock: 45,
    icon: '🫙', isFeatured: true, brand: 'Amul',
    images: ['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80'],
    description: 'Pure desi cow ghee made from fresh cream, rich in vitamins A, D, E and K.',
    tags: ['ghee', 'dairy', 'premium']
  },
  {
    name: 'Turmeric Powder', category: catMap['Groceries & Food'],
    price: 75, mrp: 90, unit: '200 g', stock: 200,
    icon: '🌿', brand: 'Everest',
    images: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=80'],
    description: 'Pure turmeric powder with high curcumin content — anti-inflammatory and essential for curries.',
    tags: ['spice', 'turmeric', 'healthy']
  },
  {
    name: 'Whole Wheat Atta', category: catMap['Groceries & Food'],
    price: 55, mrp: 65, unit: '1 kg', stock: 250,
    icon: '🌾', isFeatured: true, brand: 'Aashirvaad',
    images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80'],
    description: 'Stone-ground whole wheat flour for soft, nutritious rotis. 100% whole wheat, no maida.',
    tags: ['atta', 'wheat', 'flour', 'healthy']
  },
  {
    name: 'Filter Coffee Powder', category: catMap['Groceries & Food'],
    price: 220, mrp: 270, unit: '250 g', stock: 60,
    icon: '☕', isFeatured: true, brand: 'Cothas',
    images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&q=80'],
    description: 'Authentic South Indian filter coffee blend — 80% coffee, 20% chicory. Perfect aroma.',
    tags: ['coffee', 'south-indian', 'beverage']
  },

  // ── Dress & Fashion ──────────────────────────────────────────────
  {
    name: 'Kanjivaram Silk Saree', category: catMap['Dress & Fashion'],
    price: 4500, mrp: 6000, unit: '1 piece', stock: 15,
    icon: '👘', isFeatured: true, brand: 'Nalli',
    images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&q=80'],
    description: 'Authentic Kanjivaram silk saree with zari border, perfect for weddings and festivals.',
    tags: ['saree', 'silk', 'ethnic', 'wedding', 'women']
  },
  {
    name: 'Cotton Kurta Set', category: catMap['Dress & Fashion'],
    price: 899, mrp: 1299, unit: 'S / M / L / XL', stock: 50,
    icon: '👕', isFeatured: true, brand: 'FabIndia',
    images: ['https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=400&q=80'],
    description: 'Pure cotton kurta with matching pyjama, comfortable for daily wear and casual outings.',
    tags: ['kurta', 'cotton', 'ethnic', 'men']
  },
  {
    name: 'Anarkali Suit', category: catMap['Dress & Fashion'],
    price: 1799, mrp: 2499, unit: 'S / M / L / XL', stock: 30,
    icon: '👗', isFeatured: true, brand: 'Utsav Fashion',
    images: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&q=80'],
    description: 'Embroidered Anarkali suit with dupatta, ideal for festive occasions and family functions.',
    tags: ['anarkali', 'ethnic', 'women', 'festive']
  },
  {
    name: 'Sports T-Shirt', category: catMap['Dress & Fashion'],
    price: 499, mrp: 799, unit: 'S / M / L / XL', stock: 80,
    icon: '👕', brand: 'Puma',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80'],
    description: 'Dry-fit moisture-wicking sports t-shirt for gym, running or casual wear.',
    tags: ['sports', 't-shirt', 'men', 'gym']
  },
  {
    name: 'Leather Sandals', category: catMap['Dress & Fashion'],
    price: 1299, mrp: 1799, unit: '6 / 7 / 8 / 9 / 10', stock: 25,
    icon: '👡', brand: 'Bata',
    images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80'],
    description: 'Genuine leather flat sandals with cushioned sole — elegant and comfortable.',
    tags: ['sandals', 'leather', 'footwear', 'women']
  },

  // ── Gifts & Occasions ────────────────────────────────────────────
  {
    name: 'Diwali Gift Hamper', category: catMap['Gifts & Occasions'],
    price: 1499, mrp: 1999, unit: '1 set', stock: 20,
    icon: '🎁', isFeatured: true, brand: 'INDGLOBAL',
    images: ['https://images.unsplash.com/photo-1607897887-ff0d3c2e2c82?w=400&q=80'],
    description: 'Premium Diwali hamper with dry fruits, sweets, diyas & chocolates in a beautiful box.',
    tags: ['diwali', 'hamper', 'festival', 'gift']
  },
  {
    name: 'Scented Candle Set', category: catMap['Gifts & Occasions'],
    price: 599, mrp: 799, unit: 'Set of 3', stock: 45,
    icon: '🕯️', brand: 'Aromafresh',
    images: ['https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=400&q=80'],
    description: 'Hand-poured soy wax candles with jasmine, rose & sandalwood fragrances.',
    tags: ['candle', 'fragrance', 'gift', 'home']
  },
  {
    name: 'Personalised Photo Frame', category: catMap['Gifts & Occasions'],
    price: 399, mrp: 599, unit: '1 piece', stock: 60,
    icon: '🖼️', isFeatured: true, brand: 'PrintKaro',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80'],
    description: 'Customisable wooden photo frame — perfect for birthdays and anniversaries.',
    tags: ['photo', 'personalised', 'birthday', 'anniversary']
  },
  {
    name: 'Brass Puja Thali Set', category: catMap['Gifts & Occasions'],
    price: 899, mrp: 1299, unit: '1 set', stock: 25,
    icon: '🪔', isFeatured: true, brand: 'Traditional Arts',
    images: ['https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80'],
    description: 'Handcrafted brass thali with diya, kalash and incense holder — perfect pooja gift.',
    tags: ['puja', 'brass', 'traditional', 'religious', 'gift']
  },

  // ── Home & Kitchen ───────────────────────────────────────────────
  {
    name: 'Stainless Steel Tawa', category: catMap['Home & Kitchen'],
    price: 499, mrp: 699, unit: '1 piece', stock: 40,
    icon: '🍳', brand: 'Prestige',
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80'],
    description: 'Heavy gauge stainless steel tawa — induction compatible, easy to clean.',
    tags: ['cookware', 'kitchen', 'tawa']
  },
  {
    name: 'Bamboo Serving Set', category: catMap['Home & Kitchen'],
    price: 749, mrp: 999, unit: 'Set of 4', stock: 20,
    icon: '🥄', isFeatured: true, brand: 'Eco Living',
    images: ['https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&q=80'],
    description: 'Eco-friendly bamboo spoon and spatula set — sustainable kitchen essentials.',
    tags: ['bamboo', 'eco', 'kitchen', 'sustainable']
  },

  // ── Health & Beauty ──────────────────────────────────────────────
  {
    name: 'Kumkumadi Face Oil', category: catMap['Health & Beauty'],
    price: 799, mrp: 1099, unit: '30 ml', stock: 35,
    icon: '✨', isFeatured: true, brand: 'Forest Essentials',
    images: ['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80'],
    description: 'Traditional Ayurvedic facial oil with saffron and herbs for glowing, radiant skin.',
    tags: ['skincare', 'ayurvedic', 'face', 'glow']
  },
  {
    name: 'Neem Tulsi Soap', category: catMap['Health & Beauty'],
    price: 99, mrp: 130, unit: 'Pack of 3', stock: 100,
    icon: '🧼', brand: 'Khadi Natural',
    images: ['https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400&q=80'],
    description: 'Handmade neem and tulsi soap with antibacterial properties for healthy skin.',
    tags: ['soap', 'natural', 'herbal', 'neem']
  },
  {
    name: 'Rose Water Toner', category: catMap['Health & Beauty'],
    price: 199, mrp: 275, unit: '200 ml', stock: 60,
    icon: '🌹', brand: 'Biotique',
    images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&q=80'],
    description: 'Pure distilled rose water toner for hydrated, radiant and fresh-feeling skin.',
    tags: ['toner', 'rose', 'skincare', 'hydration']
  },

  // ── Electronics ──────────────────────────────────────────────────
  {
    name: 'Wireless Earbuds', category: catMap['Electronics'],
    price: 1499, mrp: 2499, unit: '1 pair', stock: 30,
    icon: '🎧', isFeatured: true, brand: 'boAt',
    images: ['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80'],
    description: 'True wireless earbuds with 24hr battery life, IPX5 water resistance and deep bass.',
    tags: ['audio', 'wireless', 'earbuds', 'music']
  },
  {
    name: 'USB-C Fast Charger 65W', category: catMap['Electronics'],
    price: 699, mrp: 999, unit: '1 piece', stock: 50,
    icon: '🔌', brand: 'Ambrane',
    images: ['https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=80'],
    description: '65W GaN fast charger compatible with all USB-C devices. Charges phone in 30 mins.',
    tags: ['charger', 'fast-charging', 'usb-c', 'gan']
  },
  {
    name: 'Smart LED Bulb', category: catMap['Electronics'],
    price: 349, mrp: 499, unit: 'Pack of 2', stock: 40,
    icon: '💡', isFeatured: true, brand: 'Syska',
    images: ['https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400&q=80'],
    description: 'WiFi smart LED bulbs with 16 million colours — voice control and app controlled.',
    tags: ['smart', 'led', 'home-automation', 'wifi']
  }
];

// ── SEED FUNCTION ─────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Wipe existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Users
    const hashedUsers = await Promise.all([
      { name: 'Admin User',  email: 'admin@indglobal.com', password: await bcrypt.hash('admin123', 10), role: 'admin',  phone: '9000000000' },
      { name: 'Priya Sharma',email: 'priya@example.com',   password: await bcrypt.hash('user123',  10), role: 'user',   phone: '9876543210' }
    ].map(u => u));
    await User.insertMany(hashedUsers);
    console.log(`✅ ${hashedUsers.length} users seeded`);

    // Categories
    const cats = await Category.insertMany(categories);
    const catMap = {};
    cats.forEach(c => { catMap[c.name] = c._id; });
    console.log(`✅ ${cats.length} categories seeded`);

    // Products
    const products = buildProducts(catMap);
    await Product.insertMany(products);
    console.log(`✅ ${products.length} products seeded`);

    console.log('\n🎉 Seed complete!\n');
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│  Admin: admin@indglobal.com  /  admin123    │');
    console.log('│  User:  priya@example.com    /  user123     │');
    console.log('└─────────────────────────────────────────────┘');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();