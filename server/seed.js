const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Product = require('./models/Product');

// Load environment variables
dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/shopledger';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Demo user details
    const demoUserEmail = 'demo@shopledger.com';

    // Remove existing demo user and related data for idempotency
    const existingDemoUser = await User.findOne({ email: demoUserEmail });
    if (existingDemoUser) {
      console.log('Clearing existing demo user data...');
      await Customer.deleteMany({ userId: existingDemoUser._id });
      await Product.deleteMany({ userId: existingDemoUser._id });
      await User.deleteOne({ _id: existingDemoUser._id });
    }

    // 1. Create Demo User
    console.log('Creating demo user...');
    const demoUser = await User.create({
      name: 'Demo Owner',
      email: demoUserEmail,
      passwordHash: 'Password123!',
      shopName: 'ShopLedger Demo Superstore'
    });

    // 2. Seed 3 Customers
    console.log('Seeding customers...');
    const customersData = [
      {
        userId: demoUser._id,
        name: 'Muhammad Ali',
        phone: '03001234567',
        totalBalance: 15000
      },
      {
        userId: demoUser._id,
        name: 'Usman Ghani',
        phone: '03119876543',
        totalBalance: 0
      },
      {
        userId: demoUser._id,
        name: 'Sara Ahmed',
        phone: '03215554321',
        totalBalance: -2500
      }
    ];

    const seededCustomers = await Customer.insertMany(customersData);
    console.log(`Successfully seeded ${seededCustomers.length} customers.`);

    // 3. Seed 5 Products (2 items low stock)
    console.log('Seeding products...');
    const productsData = [
      {
        userId: demoUser._id,
        name: 'Premium Basmati Rice 5kg',
        sku: 'RICE-5KG-01',
        price: 1850,
        stockQuantity: 45,
        lowStockThreshold: 10
      },
      {
        userId: demoUser._id,
        name: 'Cooking Oil 3L',
        sku: 'OIL-3L-02',
        price: 1620,
        stockQuantity: 28,
        lowStockThreshold: 5
      },
      {
        userId: demoUser._id,
        name: 'Refined Wheat Flour (Atta) 10kg',
        sku: 'ATTA-10KG-03',
        price: 1400,
        stockQuantity: 2, // Low stock (<= 5)
        lowStockThreshold: 5
      },
      {
        userId: demoUser._id,
        name: 'White Sugar 1kg',
        sku: 'SUGAR-1KG-04',
        price: 150,
        stockQuantity: 1, // Low stock (<= 10)
        lowStockThreshold: 10
      },
      {
        userId: demoUser._id,
        name: 'Green Tea Pack 250g',
        sku: 'TEA-250G-05',
        price: 480,
        stockQuantity: 18,
        lowStockThreshold: 5
      }
    ];

    const seededProducts = await Product.insertMany(productsData);
    console.log(`Successfully seeded ${seededProducts.length} products (including 2 low-stock items).`);

    console.log('\n========================================');
    console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log(`Demo User Credentials:`);
    console.log(`Email: ${demoUserEmail}`);
    console.log(`Password: Password123!`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDatabase();
