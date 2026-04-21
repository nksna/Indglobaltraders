const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
dotenv.config();

const User = require('./models/user');
const Product = require('./models/product');

const users = [
  {
    name: 'Admin User',
    email: 'admin@indglobal.com',
    password: 'admin123',
    role: 'admin',
    phone: '9000000000'
  },
  {
    name: 'Priya Sharma',
    email: 'priya@example.com',
    password: 'user123',
    role: 'user',
    phone: '9876543210'
  }
];

const products = [
  // Rice & Grains
  { name: 'Sona Masoori Rice', category: 'Rice & Grains', price: 65, mrp: 80, unit: '1 kg', stock: 200, isFeatured: true, brand: 'Farm Fresh', description: 'Premium quality Sona Masoori rice sourced directly from Andhra Pradesh farms. Light, fluffy, and perfect for everyday cooking.', sku: 'RG001', tags: ['rice', 'premium'] },
  { name: 'Basmati Rice', category: 'Rice & Grains', price: 120, mrp: 150, unit: '1 kg', stock: 150, isFeatured: true, brand: 'Dawat', description: 'Long grain aromatic Basmati rice, aged for superior taste and fragrance. Ideal for biryanis and pulao.', sku: 'RG002', tags: ['basmati', 'premium', 'biryani'] },
  { name: 'Wheat Dalia', category: 'Rice & Grains', price: 45, mrp: 60, unit: '500 g', stock: 100, brand: 'Nature\'s Best', description: 'Broken wheat dalia, high in fiber and great for porridge and upma.', sku: 'RG003', tags: ['healthy', 'breakfast'] },
  { name: 'Jowar (Sorghum)', category: 'Rice & Grains', price: 55, mrp: 70, unit: '1 kg', stock: 80, brand: 'Farm Fresh', description: 'Traditional jowar millets, gluten-free and nutritious. Great for rotis and porridge.', sku: 'RG004', tags: ['millet', 'gluten-free'] },

  // Dals & Pulses
  { name: 'Toor Dal (Arhar)', category: 'Dals & Pulses', price: 140, mrp: 165, unit: '1 kg', stock: 180, isFeatured: true, brand: 'Farm Fresh', description: 'Premium quality toor dal, the backbone of Indian sambar and dal preparations. Rich in protein.', sku: 'DP001', tags: ['dal', 'protein'] },
  { name: 'Moong Dal (Split)', category: 'Dals & Pulses', price: 110, mrp: 135, unit: '1 kg', stock: 120, brand: 'Nature\'s Best', description: 'Split yellow moong dal, easy to digest and rich in nutrients. Perfect for khichdi and soups.', sku: 'DP002', tags: ['dal', 'light', 'healthy'] },
  { name: 'Chana Dal', category: 'Dals & Pulses', price: 95, mrp: 115, unit: '1 kg', stock: 90, brand: 'Farm Fresh', description: 'Bengal gram dal, nutty flavour and rich in fiber. Great for curries and snacks.', sku: 'DP003' },
  { name: 'Masoor Dal (Red)', category: 'Dals & Pulses', price: 85, mrp: 100, unit: '1 kg', stock: 110, brand: 'Farm Fresh', description: 'Red lentils that cook quickly and are loaded with iron and folate.', sku: 'DP004' },

  // Oils & Ghee
  { name: 'Cold Pressed Groundnut Oil', category: 'Oils & Ghee', price: 280, mrp: 330, unit: '1 L', stock: 60, isFeatured: true, brand: 'Woodpress', description: 'Traditional cold-pressed groundnut oil, extracted without heat. Retains natural nutrients and rich flavour.', sku: 'OG001', tags: ['cold-pressed', 'natural'] },
  { name: 'Pure Cow Ghee', category: 'Oils & Ghee', price: 550, mrp: 650, unit: '500 ml', stock: 45, isFeatured: true, brand: 'Amul', description: 'Pure desi cow ghee made from fresh cream. Rich in vitamins and perfect for Indian cooking and tempering.', sku: 'OG002', tags: ['ghee', 'premium', 'cow'] },
  { name: 'Coconut Oil (Virgin)', category: 'Oils & Ghee', price: 320, mrp: 380, unit: '1 L', stock: 70, brand: 'Parachute', description: 'Cold-pressed virgin coconut oil with natural aroma. Ideal for South Indian cooking.', sku: 'OG003' },

  // Spices & Masala
  { name: 'Turmeric Powder (Haldi)', category: 'Spices & Masala', price: 75, mrp: 90, unit: '200 g', stock: 200, isFeatured: true, brand: 'Everest', description: 'Pure turmeric powder with high curcumin content. Anti-inflammatory and essential for all Indian curries.', sku: 'SM001', tags: ['spice', 'healthy', 'turmeric'] },
  { name: 'Red Chilli Powder', category: 'Spices & Masala', price: 85, mrp: 100, unit: '200 g', stock: 180, brand: 'MDH', description: 'Premium Kashmiri red chilli powder for vibrant colour and moderate heat.', sku: 'SM002' },
  { name: 'Garam Masala', category: 'Spices & Masala', price: 95, mrp: 115, unit: '100 g', stock: 150, brand: 'Everest', description: 'Aromatic blend of whole spices. The secret to restaurant-style curries at home.', sku: 'SM003', tags: ['blend', 'aromatic'] },
  { name: 'Cumin Seeds (Jeera)', category: 'Spices & Masala', price: 65, mrp: 80, unit: '100 g', stock: 200, brand: 'Farm Fresh', description: 'Whole cumin seeds, earthy and warm. Essential for tempering and flavouring dals.', sku: 'SM004' },

  // Flour & Atta
  { name: 'Whole Wheat Atta', category: 'Flour & Atta', price: 55, mrp: 65, unit: '1 kg', stock: 250, isFeatured: true, brand: 'Aashirvaad', description: 'Stone-ground whole wheat flour for soft and nutritious rotis. 100% whole wheat with no maida.', sku: 'FA001', tags: ['atta', 'whole wheat', 'healthy'] },
  { name: 'Besan (Chickpea Flour)', category: 'Flour & Atta', price: 70, mrp: 85, unit: '1 kg', stock: 120, brand: 'Nature\'s Best', description: 'Fine ground chickpea flour, protein-rich and versatile for kadhi, pakoras, and sweets.', sku: 'FA002' },
  { name: 'Rice Flour', category: 'Flour & Atta', price: 45, mrp: 55, unit: '1 kg', stock: 100, brand: 'Farm Fresh', description: 'Fine rice flour for making idiyappam, puttu, and crispy batters.', sku: 'FA003' },

  // Sugar & Salt
  { name: 'Raw Cane Sugar (Jaggery Powder)', category: 'Sugar & Salt', price: 90, mrp: 110, unit: '1 kg', stock: 130, isFeatured: true, brand: 'Organic India', description: 'Unrefined cane sugar with molasses intact. Natural sweetener retaining minerals.', sku: 'SS001', tags: ['natural', 'unrefined', 'healthy'] },
  { name: 'Himalayan Pink Salt', category: 'Sugar & Salt', price: 55, mrp: 70, unit: '1 kg', stock: 150, brand: 'Tata', description: 'Pure Himalayan rock salt, mineral-rich and with a milder taste than regular salt.', sku: 'SS002', tags: ['himalayan', 'mineral'] },

  // Snacks
  { name: 'Roasted Chana', category: 'Snacks', price: 60, mrp: 75, unit: '250 g', stock: 100, isFeatured: true, brand: 'Farm Fresh', description: 'Crunchy roasted Bengal gram, a protein-packed healthy snack. Lightly salted and satisfying.', sku: 'SN001', tags: ['healthy', 'snack', 'protein'] },
  { name: 'Murukku (Rice Crackers)', category: 'Snacks', price: 80, mrp: 100, unit: '200 g', stock: 80, brand: 'Haldirams', description: 'Traditional South Indian rice flour murukku, crispy and perfectly spiced.', sku: 'SN002' },
  { name: 'Trail Mix (Nuts & Seeds)', category: 'Snacks', price: 180, mrp: 220, unit: '250 g', stock: 50, brand: 'Nature\'s Best', description: 'Premium mix of almonds, cashews, pumpkin seeds and raisins. Energy-boosting snack.', sku: 'SN003', tags: ['nuts', 'premium', 'healthy'] },

  // Tea & Coffee
  { name: 'Assam CTC Tea', category: 'Tea & Coffee', price: 180, mrp: 220, unit: '500 g', stock: 80, isFeatured: true, brand: 'Tata Tea', description: 'Bold, malty Assam CTC tea for a strong morning brew. Rich colour and full-bodied flavour.', sku: 'TC001', tags: ['tea', 'assam', 'morning'] },
  { name: 'Filter Coffee Powder', category: 'Tea & Coffee', price: 220, mrp: 270, unit: '250 g', stock: 60, isFeatured: true, brand: 'Cothas', description: 'Authentic South Indian filter coffee blend — 80% coffee, 20% chicory. Perfect with a steel davara.', sku: 'TC002', tags: ['coffee', 'south indian', 'filter'] },
  { name: 'Green Tea (Tulsi Ginger)', category: 'Tea & Coffee', price: 150, mrp: 185, unit: '25 bags', stock: 90, brand: 'Organic India', description: 'Refreshing green tea with tulsi and ginger. Antioxidant-rich and great for immunity.', sku: 'TC003', tags: ['green tea', 'healthy', 'organic'] }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await User.deleteMany({});
    await Product.deleteMany({});

    // Hash passwords and insert users
    const hashedUsers = await Promise.all(
      users.map(async (u) => ({ ...u, password: await bcrypt.hash(u.password, 10) }))
    );
    await User.insertMany(hashedUsers);
    console.log(`✅ Seeded ${hashedUsers.length} users`);

    await Product.insertMany(products);
    console.log(`✅ Seeded ${products.length} products`);

    console.log('\n🎉 Seed complete!\n');
    console.log('Admin login: admin@indglobal.com / admin123');
    console.log('User login:  priya@example.com / user123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();
