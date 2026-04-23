const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/user');
const Category = require('./models/category');
const Product = require('./models/product');

const categories = [
  { name: 'Groceries & Food', icon: '🛒', color: '#16a34a', description: 'Fresh farm produce, pantry staples & daily essentials', sortOrder: 1 },
  { name: 'Dress & Fashion', icon: '👗', color: '#db2777', description: 'Trendy clothing, ethnic wear & accessories for all', sortOrder: 2 },
  { name: 'Gifts & Occasions', icon: '🎁', color: '#9333ea', description: 'Curated gift hampers, decor & celebration essentials', sortOrder: 3 },
  { name: 'Home & Kitchen', icon: '🏠', color: '#ea580c', description: 'Cookware, appliances & home décor', sortOrder: 4 },
  { name: 'Health & Beauty', icon: '💄', color: '#e11d48', description: 'Skincare, wellness & personal care products', sortOrder: 5 },
  { name: 'Electronics', icon: '📱', color: '#2563eb', description: 'Gadgets, accessories & smart devices', sortOrder: 6 },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected');

  await User.deleteMany({});
  await Category.deleteMany({});
  await Product.deleteMany({});

  // Users
  await User.insertMany([
    { name: 'Admin User', email: 'admin@indglobal.com', password: await bcrypt.hash('admin123', 10), role: 'admin', phone: '9000000000' },
    { name: 'Priya Sharma', email: 'priya@example.com', password: await bcrypt.hash('user123', 10), role: 'user', phone: '9876543210' }
  ]);
  console.log('✅ Users seeded');

  // Categories
  const cats = await Category.insertMany(categories);
  const catMap = {};
  cats.forEach(c => { catMap[c.name] = c._id; });
  console.log('✅ Categories seeded');

  // Products
  const products = [
    // Groceries & Food
    { name: 'Sona Masoori Rice', category: catMap['Groceries & Food'], price: 65, mrp: 80, unit: '1 kg', stock: 200, icon: '🌾', isFeatured: true, brand: 'Farm Fresh', description: 'Premium quality rice from Andhra Pradesh farms', tags: ['rice', 'staple'] },
    { name: 'Toor Dal', category: catMap['Groceries & Food'], price: 140, mrp: 165, unit: '1 kg', stock: 180, icon: '🫘', isFeatured: true, brand: 'Farm Fresh', description: 'Protein-rich toor dal, essential for sambar & dal', tags: ['dal', 'protein'] },
    { name: 'Pure Cow Ghee', category: catMap['Groceries & Food'], price: 550, mrp: 650, unit: '500 ml', stock: 45, icon: '🫙', isFeatured: true, brand: 'Amul', description: 'Pure desi cow ghee, rich in vitamins', tags: ['ghee', 'premium'] },
    { name: 'Turmeric Powder', category: catMap['Groceries & Food'], price: 75, mrp: 90, unit: '200 g', stock: 200, icon: '🌶️', brand: 'Everest', description: 'Pure turmeric with high curcumin content', tags: ['spice', 'healthy'] },
    { name: 'Whole Wheat Atta', category: catMap['Groceries & Food'], price: 55, mrp: 65, unit: '1 kg', stock: 250, icon: '🌾', isFeatured: true, brand: 'Aashirvaad', description: 'Stone-ground whole wheat flour for soft rotis', tags: ['atta', 'healthy'] },
    { name: 'Filter Coffee Powder', category: catMap['Groceries & Food'], price: 220, mrp: 270, unit: '250 g', stock: 60, icon: '☕', isFeatured: true, brand: 'Cothas', description: 'Authentic South Indian filter coffee blend 80:20', tags: ['coffee', 'beverage'] },

    // Dress & Fashion
    { name: 'Silk Saree (Kanjivaram)', category: catMap['Dress & Fashion'], price: 4500, mrp: 6000, unit: '1 piece', stock: 15, icon: '👘', isFeatured: true, brand: 'Nalli', description: 'Authentic Kanjivaram silk saree with zari border, perfect for weddings and festivals', tags: ['saree', 'silk', 'ethnic', 'wedding'] },
    { name: 'Cotton Kurta Set', category: catMap['Dress & Fashion'], price: 899, mrp: 1299, unit: 'M/L/XL/XXL', stock: 50, icon: '👕', isFeatured: true, brand: 'FabIndia', description: 'Pure cotton kurta with matching pyjama, comfortable for daily wear', tags: ['kurta', 'cotton', 'ethnic', 'men'] },
    { name: 'Anarkali Suit', category: catMap['Dress & Fashion'], price: 1799, mrp: 2499, unit: 'S/M/L/XL', stock: 30, icon: '👗', isFeatured: true, brand: 'Utsav Fashion', description: 'Embroidered Anarkali suit with dupatta, ideal for festive occasions', tags: ['anarkali', 'ethnic', 'women', 'festive'] },
    { name: 'Sports T-Shirt', category: catMap['Dress & Fashion'], price: 499, mrp: 799, unit: 'S/M/L/XL', stock: 80, icon: '👕', brand: 'Puma', description: 'Dry-fit moisture wicking sports t-shirt', tags: ['sports', 'tshirt', 'men'] },
    { name: 'Handloom Dupatta', category: catMap['Dress & Fashion'], price: 649, mrp: 899, unit: '1 piece', stock: 40, icon: '🧣', brand: 'Handloom House', description: 'Hand-woven cotton dupatta with block print', tags: ['dupatta', 'handloom', 'women'] },
    { name: 'Leather Sandals', category: catMap['Dress & Fashion'], price: 1299, mrp: 1799, unit: '6/7/8/9/10', stock: 25, icon: '👡', brand: 'Bata', description: 'Genuine leather flat sandals with cushioned sole', tags: ['sandals', 'leather', 'footwear'] },

    // Gifts & Occasions
    { name: 'Diwali Gift Hamper', category: catMap['Gifts & Occasions'], price: 1499, mrp: 1999, unit: '1 set', stock: 20, icon: '🎁', isFeatured: true, brand: 'INDGLOBAL', description: 'Premium Diwali hamper with dry fruits, sweets, diyas & chocolates', tags: ['diwali', 'hamper', 'festival', 'gift'] },
    { name: 'Scented Candle Set', category: catMap['Gifts & Occasions'], price: 599, mrp: 799, unit: 'Set of 3', stock: 45, icon: '🕯️', brand: 'Aromafresh', description: 'Hand-poured soy wax candles with jasmine & rose fragrances', tags: ['candle', 'fragrance', 'gift'] },
    { name: 'Personalised Photo Frame', category: catMap['Gifts & Occasions'], price: 399, mrp: 599, unit: '1 piece', stock: 60, icon: '🖼️', isFeatured: true, brand: 'PrintKaro', description: 'Customisable wooden photo frame, perfect for birthdays and anniversaries', tags: ['photo', 'personalised', 'birthday'] },
    { name: 'Rakhi Gift Box', category: catMap['Gifts & Occasions'], price: 799, mrp: 999, unit: '1 set', stock: 35, icon: '🎀', brand: 'INDGLOBAL', description: 'Designer Rakhi with chocolates and dry fruits in a premium box', tags: ['rakhi', 'festival', 'gift'] },
    { name: 'Brass Puja Thali Set', category: catMap['Gifts & Occasions'], price: 899, mrp: 1299, unit: '1 set', stock: 25, icon: '🪔', isFeatured: true, brand: 'Traditional Arts', description: 'Handcrafted brass thali with diya, kalash, and incense holder', tags: ['puja', 'brass', 'traditional', 'gift'] },

    // Home & Kitchen
    { name: 'Stainless Steel Tawa', category: catMap['Home & Kitchen'], price: 499, mrp: 699, unit: '1 piece', stock: 40, icon: '🍳', brand: 'Prestige', description: 'Heavy gauge stainless steel tawa, induction compatible', tags: ['cookware', 'tawa', 'kitchen'] },
    { name: 'Earthen Clay Pot', category: catMap['Home & Kitchen'], price: 299, mrp: 399, unit: '2L capacity', stock: 30, icon: '🫙', isFeatured: true, brand: 'Clay Craft', description: 'Traditional clay pot for water storage and cooking, keeps water naturally cool', tags: ['clay', 'traditional', 'home'] },
    { name: 'Bamboo Serving Set', category: catMap['Home & Kitchen'], price: 749, mrp: 999, unit: 'Set of 4', stock: 20, icon: '🥄', brand: 'Eco Living', description: 'Eco-friendly bamboo spoon and spatula set', tags: ['bamboo', 'eco', 'kitchen'] },

    // Health & Beauty
    { name: 'Kumkumadi Face Oil', category: catMap['Health & Beauty'], price: 799, mrp: 1099, unit: '30 ml', stock: 35, icon: '✨', isFeatured: true, brand: 'Forest Essentials', description: 'Traditional Ayurvedic facial oil for glowing skin, with saffron and herbs', tags: ['skincare', 'ayurvedic', 'face'] },
    { name: 'Neem Tulsi Soap', category: catMap['Health & Beauty'], price: 99, mrp: 130, unit: 'Pack of 3', stock: 100, icon: '🧼', brand: 'Khadi Natural', description: 'Handmade neem and tulsi soap for antibacterial skin care', tags: ['soap', 'natural', 'herbal'] },
    { name: 'Rose Water Toner', category: catMap['Health & Beauty'], price: 199, mrp: 275, unit: '200 ml', stock: 60, icon: '🌹', brand: 'Biotique', description: 'Pure distilled rose water toner for hydrated, radiant skin', tags: ['toner', 'rose', 'skincare'] },

    // Electronics
    { name: 'Wireless Earbuds', category: catMap['Electronics'], price: 1499, mrp: 2499, unit: '1 pair', stock: 30, icon: '🎧', isFeatured: true, brand: 'boAt', description: 'True wireless earbuds with 24hr battery, IPX5 water resistance', tags: ['audio', 'wireless', 'earbuds'] },
    { name: 'USB-C Fast Charger', category: catMap['Electronics'], price: 699, mrp: 999, unit: '1 piece', stock: 50, icon: '🔌', brand: 'Ambrane', description: '65W GaN fast charger compatible with all USB-C devices', tags: ['charger', 'fast', 'usb-c'] },
    { name: 'Smart LED Bulb', category: catMap['Electronics'], price: 349, mrp: 499, unit: 'Pack of 2', stock: 40, icon: '💡', isFeatured: true, brand: 'Syska', description: 'WiFi smart LED bulbs, 16M colours, voice control compatible', tags: ['smart', 'led', 'home'] },
  ];

  await Product.insertMany(products);
  console.log(`✅ ${products.length} products seeded across ${cats.length} categories`);
  console.log('\n🎉 Seed complete!');
  console.log('Admin: admin@indglobal.com / admin123');
  console.log('User:  priya@example.com / user123');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });