// ============================================================
// seed/seedData.js
// Populates MongoDB with demo products and an admin user
// Run: npm run seed  (from the backend/ directory)
// ============================================================

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User     = require('../models/User');
const Product  = require('../models/Product');
const connectDB = require('../config/db');

// ── Sample Products (match frontend categories) ───────────────
const sampleProducts = [
  {
    name: 'Wireless Headphones',
    description: 'Premium over-ear wireless headphones with 30-hour battery life and active noise cancellation.',
    category: 'Electronics',
    brand: 'SoundPro',
    price: 2499,
    stock: 15,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80'],
  },
  {
    name: 'Smart Watch',
    description: 'Feature-packed smartwatch with heart rate monitor, GPS, and 7-day battery life.',
    category: 'Electronics',
    brand: 'TechWear',
    price: 4999,
    stock: 10,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80'],
  },
  {
    name: 'Running Shoes',
    description: 'Lightweight and breathable running shoes with superior cushioning for long runs.',
    category: 'Fashion',
    brand: 'SwiftStride',
    price: 1899,
    stock: 20,
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80'],
  },
  {
    name: 'Backpack',
    description: '30L waterproof backpack with laptop compartment and multiple organizer pockets.',
    category: 'Fashion',
    brand: 'CarryPro',
    price: 1299,
    stock: 25,
    images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80'],
  },
  {
    name: 'Coffee Maker',
    description: 'Programmable drip coffee maker with 12-cup carafe and built-in grinder.',
    category: 'Home',
    brand: 'BrewMaster',
    price: 3499,
    stock: 8,
    images: ['https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600&q=80'],
  },
  {
    name: 'Yoga Mat',
    description: 'Non-slip 6mm thick eco-friendly yoga mat with carry strap. Ideal for all yoga styles.',
    category: 'Sports',
    brand: 'ZenFlex',
    price: 799,
    stock: 30,
    images: ['https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=600&q=80'],
  },
  {
    name: 'Sunglasses',
    description: 'UV400 polarized sunglasses with lightweight titanium frame. Unisex design.',
    category: 'Fashion',
    brand: 'VisionStyle',
    price: 1499,
    stock: 18,
    images: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80'],
  },
  {
    name: 'Bluetooth Speaker',
    description: '360-degree sound portable Bluetooth speaker, IPX7 waterproof, 20-hour playtime.',
    category: 'Electronics',
    brand: 'SoundPro',
    price: 1999,
    stock: 12,
    images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80'],
  },
  {
    name: 'Moisturizing Face Cream',
    description: 'Deep hydration face cream with hyaluronic acid and vitamin C. For all skin types.',
    category: 'Beauty',
    brand: 'GlowSkin',
    price: 599,
    stock: 40,
    images: ['https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&q=80'],
  },
  {
    name: 'JavaScript: The Good Parts',
    description: 'Classic programming book by Douglas Crockford. Essential for web developers.',
    category: 'Books',
    brand: "O'Reilly",
    price: 499,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&q=80'],
  },
];

// ── Admin User ─────────────────────────────────────────────
const adminUser = {
  name:     'Admin User',
  email:    'admin@shopease.com',
  mobile:   '9000000000',
  password: 'admin123',    // Will be hashed by pre-save hook
  role:     'admin',
};

const demoUser = {
  name:     'Demo User',
  email:    'demo@shopease.in',
  mobile:   '9999999999',
  password: 'demo1234',
  role:     'user',
};

// ── Main Seed Function ──────────────────────────────────────
const seed = async () => {
  await connectDB();

  console.log('\n🌱 Starting seed...\n');

  // ── Clear existing data ──
  await Product.deleteMany({});
  await User.deleteMany({ email: { $in: [adminUser.email, demoUser.email] } });
  console.log('🗑️  Cleared existing seed data');

  // ── Insert products ──
  const createdProducts = await Product.insertMany(sampleProducts);
  console.log(`✅  Inserted ${createdProducts.length} products`);

  // ── Create admin user (pre-save hook hashes password) ──
  const admin = await User.create(adminUser);
  console.log(`✅  Admin user created: ${admin.email} (password: admin123)`);

  // ── Create demo user ──
  const demo = await User.create(demoUser);
  console.log(`✅  Demo user created:  ${demo.email} (password: demo1234)`);

  console.log('\n══════════════════════════════════════════════');
  console.log('  Seed completed!');
  console.log('  Admin login: admin@shopease.com / admin123');
  console.log('  User  login: demo@shopease.in   / demo1234');
  console.log('══════════════════════════════════════════════\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
