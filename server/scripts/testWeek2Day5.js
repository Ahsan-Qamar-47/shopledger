const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Expense = require('../models/Expense');

let server;
let baseUrl;

const logPass = (title) => console.log(`\x1b[32m[PASS]\x1b[0m ${title}`);
const logFail = (title, err) => {
  console.error(`\x1b[31m[FAIL]\x1b[0m ${title}`);
  if (err) console.error(err);
  process.exit(1);
};

async function apiRequest(endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  ShopLedger Week 2 Day 5: Cashier Dashboard Tests');
  console.log('======================================================\n');

  try {
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('open', resolve));
    }
    logPass('Connected to MongoDB');

    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api`;
    logPass(`Test server listening on port ${port}`);

    const timestamp = Date.now();
    const ownerEmail = `owner-day5-${timestamp}@test.com`;
    const cashierEmail = `cashier-day5-${timestamp}@test.com`;

    // 1. Setup: Register Owner
    const regOwnerRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Shop Owner Day5',
        email: ownerEmail,
        password: 'Password123!',
        shopName: 'Green Grocers Superstore',
        role: 'Owner'
      })
    });
    if (regOwnerRes.status !== 201) logFail('Register Owner failed', regOwnerRes.data);
    const ownerToken = regOwnerRes.data.token;
    const ownerId = regOwnerRes.data.user.id;
    logPass('Setup: Registered Owner');

    // 2. Setup: Owner registers Cashier under same shop
    const regCashierRes = await apiRequest('/auth/register-cashier', {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({
        name: 'Desk Cashier Day5',
        email: cashierEmail,
        password: 'Password123!'
      })
    });
    if (regCashierRes.status !== 201) logFail('Register Cashier failed', regCashierRes.data);
    const cashierId = regCashierRes.data.user.id;
    logPass('Setup: Registered Cashier under Owner shop');

    // 3. Login as Cashier to get active session
    const cashierLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: cashierEmail,
        password: 'Password123!'
      })
    });
    if (cashierLoginRes.status !== 200 || !cashierLoginRes.data.token) {
      logFail('Login Cashier failed', cashierLoginRes.data);
    }
    const cashierToken = cashierLoginRes.data.token;
    logPass('Setup: Logged in as Cashier');

    // 4. Setup operational data:
    // 4a. Customers with positive balances (debtors)
    const cust1 = await Customer.create({
      userId: ownerId,
      name: 'Debtor Customer One',
      phone: '03001234567',
      totalBalance: 4500,
      isActive: true
    });
    const cust2 = await Customer.create({
      userId: ownerId,
      name: 'Debtor Customer Two',
      phone: '03007654321',
      totalBalance: 2500,
      isActive: true
    });
    logPass('Setup: Seeded Debtors with balances 4500 and 2500 (totalReceivables = 7000)');

    // 4b. Low stock product (stock 3 <= threshold 10)
    const lowProd = await Product.create({
      userId: ownerId,
      name: 'Low Stock Wheat Flour 10kg',
      sku: `FLOUR-${timestamp}`,
      costPrice: 850,
      price: 1100,
      stockQuantity: 3,
      lowStockThreshold: 10,
      isActive: true
    });

    // 4c. Normal stock product (stock 50 > threshold 10)
    const normalProd = await Product.create({
      userId: ownerId,
      name: 'Normal Stock Sugar 5kg',
      sku: `SUGAR-${timestamp}`,
      costPrice: 400,
      price: 550,
      stockQuantity: 50,
      lowStockThreshold: 10,
      isActive: true
    });
    logPass('Setup: Seeded 1 low-stock product and 1 normal-stock product');

    // 4d. Seed financial transaction & expense under owner to ensure they exist
    const saleTx = await Transaction.create({
      userId: ownerId,
      customerId: cust1._id,
      type: 'SALE',
      amount: 10000,
      profitAmount: 3500,
      date: new Date()
    });
    const expense = await Expense.create({
      userId: ownerId,
      category: 'Rent',
      amount: 5000,
      isActive: true,
      date: new Date()
    });
    logPass('Setup: Seeded confidential financial transaction and expense');

    // ----------------------------------------------------
    // Test 1: Unauthenticated request rejected
    // ----------------------------------------------------
    const unauthRes = await apiRequest('/dashboard/cashier-stats');
    if (unauthRes.status !== 401) {
      logFail('GET /api/dashboard/cashier-stats without token must return 401', unauthRes);
    }
    logPass('GET /api/dashboard/cashier-stats: Rejects unauthenticated request (401)');

    // ----------------------------------------------------
    // Test 2: Cashier fetches cashier-stats (200 OK)
    // ----------------------------------------------------
    const cashierStatsRes = await apiRequest('/dashboard/cashier-stats', { token: cashierToken });
    if (cashierStatsRes.status !== 200 || !cashierStatsRes.data.success) {
      logFail('GET /api/dashboard/cashier-stats failed for Cashier', cashierStatsRes.data);
    }
    const data = cashierStatsRes.data.data;
    logPass('GET /api/dashboard/cashier-stats: Cashier successfully retrieves operational stats (200 OK)');

    // ----------------------------------------------------
    // Test 3: Verify Operational Data Correctness
    // ----------------------------------------------------
    // 3a. totalReceivables must equal 7000 (4500 + 2500)
    if (data.totalReceivables !== 7000) {
      logFail(`Expected totalReceivables=7000, got ${data.totalReceivables}`);
    }
    logPass('Operational Data: totalReceivables accurately matches customer debt total (7000)');

    // 3b. lowStockItems must contain the low stock item, and exclude the normal stock product
    if (!Array.isArray(data.lowStockItems) || data.lowStockItems.length !== 1) {
      logFail(`Expected 1 lowStockItem, got ${data.lowStockItems?.length}`);
    }
    if (data.lowStockItems[0].name !== 'Low Stock Wheat Flour 10kg') {
      logFail('Wrong lowStockItem returned', data.lowStockItems);
    }
    if (data.lowStockItemCount !== 1) {
      logFail(`Expected lowStockItemCount=1, got ${data.lowStockItemCount}`);
    }
    logPass('Operational Data: lowStockItems returns exactly products with stock <= threshold');

    // 3c. topDebtors must list the 2 debtors in descending order
    if (!Array.isArray(data.topDebtors) || data.topDebtors.length !== 2) {
      logFail(`Expected 2 topDebtors, got ${data.topDebtors?.length}`);
    }
    if (data.topDebtors[0].totalBalance !== 4500 || data.topDebtors[1].totalBalance !== 2500) {
      logFail('topDebtors ordering or balances incorrect', data.topDebtors);
    }
    logPass('Operational Data: topDebtors lists top debtors sorted descending by balance');

    // ----------------------------------------------------
    // Test 4: Strict Exclusion of Financial Profit/Expense Data
    // ----------------------------------------------------
    const financialKeys = [
      'totalSales',
      'totalSalesToday',
      'grossProfit',
      'profitAmount',
      'totalExpenses',
      'netIncome',
      'breakdown',
      'salesLast7Days'
    ];

    for (const key of financialKeys) {
      if (data[key] !== undefined) {
        logFail(`Security Violation: Financial key "${key}" MUST be excluded from cashier-stats!`, data);
      }
    }
    logPass('Security / RBAC: Strictly verified exclusion of financial fields (sales, profit, expenses, netIncome, breakdown)');

    // 4b. Ensure product costPrice is not leaked in lowStockItems
    if (data.lowStockItems[0].costPrice !== undefined) {
      logFail('Security Violation: Product costPrice leaked in lowStockItems!', data.lowStockItems[0]);
    }
    logPass('Security / RBAC: Product costPrice omitted from lowStockItems');

    // ----------------------------------------------------
    // Test 5: Owner Access
    // ----------------------------------------------------
    const ownerStatsRes = await apiRequest('/dashboard/cashier-stats', { token: ownerToken });
    if (ownerStatsRes.status !== 200 || ownerStatsRes.data.data.totalReceivables !== 7000) {
      logFail('Owner failed to access cashier-stats', ownerStatsRes.data);
    }
    logPass('GET /api/dashboard/cashier-stats: Owner can also view operational stats');

    console.log('\n======================================================');
    console.log('  ALL WEEK 2 DAY 5 CASHIER DASHBOARD TESTS PASSED!');
    console.log('======================================================\n');

    // Clean up test data
    await User.deleteMany({ _id: { $in: [ownerId, cashierId] } });
    await Customer.deleteMany({ _id: { $in: [cust1._id, cust2._id] } });
    await Product.deleteMany({ _id: { $in: [lowProd._id, normalProd._id] } });
    await Transaction.deleteOne({ _id: saleTx._id });
    await Expense.deleteOne({ _id: expense._id });

    server.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    logFail('Unexpected error during test execution', err);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

runTests();
