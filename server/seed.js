const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Product = require('./models/Product');
const Transaction = require('./models/Transaction');

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
      await Transaction.deleteMany({ userId: existingDemoUser._id });
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

    // 4. Seed Transactions
    console.log('Seeding transactions...');
    const now = new Date();
    
    // Customer 1: Muhammad Ali (Balance: 15000)
    // - Sale: 20000
    // - Payment: 5000
    const trans1 = new Transaction({
      userId: demoUser._id,
      customerId: seededCustomers[0]._id,
      type: 'SALE',
      amount: 20000,
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      notes: 'Bulk purchase',
      items: [
        {
          productId: seededProducts[0]._id,
          name: seededProducts[0].name,
          quantity: 5,
          price: seededProducts[0].price
        }
      ],
      balanceAfter: 20000
    });
    const trans2 = new Transaction({
      userId: demoUser._id,
      customerId: seededCustomers[0]._id,
      type: 'PAYMENT',
      amount: 5000,
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      notes: 'Partial payment',
      balanceAfter: 15000
    });

    // Customer 2: Usman Ghani (Balance: 0)
    // - Sale: 1500
    // - Payment: 1500
    const trans3 = new Transaction({
      userId: demoUser._id,
      customerId: seededCustomers[1]._id,
      type: 'SALE',
      amount: 1500,
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      items: [
        {
          productId: seededProducts[3]._id,
          name: seededProducts[3].name,
          quantity: 10,
          price: seededProducts[3].price
        }
      ],
      balanceAfter: 1500
    });
    const trans4 = new Transaction({
      userId: demoUser._id,
      customerId: seededCustomers[1]._id,
      type: 'PAYMENT',
      amount: 1500,
      date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      notes: 'Full settlement',
      balanceAfter: 0
    });

    // Customer 3: Sara Ahmed (Balance: -2500)
    // - Payment: 2500
    const trans5 = new Transaction({
      userId: demoUser._id,
      customerId: seededCustomers[2]._id,
      type: 'PAYMENT',
      amount: 2500,
      date: new Date(), // Today
      notes: 'Advance payment',
      balanceAfter: -2500
    });

    await Transaction.insertMany([trans1, trans2, trans3, trans4, trans5]);
    console.log(`Successfully seeded 5 transactions.`);

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
