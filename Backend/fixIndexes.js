/**
 * fixIndexes.js — Run ONCE if you get duplicate key errors
 * Usage: node fixIndexes.js   (or: npm run fix)
 */
const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');
  const db = mongoose.connection.db;

  // Drop old sku_1 unique index that causes null duplicates
  try {
    await db.collection('products').dropIndex('sku_1');
    console.log('✅ Dropped old sku_1 index');
  } catch (e) {
    console.log('ℹ️  sku_1 index not found — skipping');
  }

  // Drop all collections for a clean slate
  const existing = (await db.listCollections().toArray()).map(c => c.name);
  for (const name of ['products', 'categories', 'users', 'carts', 'orders', 'wishlists']) {
    if (existing.includes(name)) {
      await db.collection(name).drop();
      console.log(`🗑️  Dropped: ${name}`);
    }
  }

  console.log('\n✅ Done. Now run: npm run seed');
  process.exit(0);
}

fix().catch(err => { console.error('❌', err.message); process.exit(1); });