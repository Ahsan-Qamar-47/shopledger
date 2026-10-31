const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const moment = require('moment-timezone');

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
  console.log('  ShopLedger Week 2 Day 3-4: Dashboard Aggregations');
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
    const ownerEmail = `dashboard-owner-${timestamp}@test.com`;

    // 1. Setup: Register Owner
    const regRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Dashboard Analytics Owner',
        email: ownerEmail,
        password: 'Password123!',
        shopName: 'Metro Mart Analytics',
        role: 'Owner'
      })
    });
    if (regRes.status !== 201) logFail('Register Owner failed', regRes.data);
    const token = regRes.data.token;
    const userId = regRes.data.user.id;
    logPass('Setup: Registered Owner');

    // 2. Setup: Create Customer
    const custRes = await apiRequest('/customers', {
      method: 'POST',
      token,
      body: JSON.stringify({
        name: 'Ali Raza',
        phone: '03001122334',
        totalBalance: 5000
      })
    });
    if (custRes.status !== 201) logFail('Create Customer failed', custRes.data);
    const customerId = custRes.data.data._id;
    logPass('Setup: Created Customer with balance 5000');

    // 3. Setup: Create Product (costPrice: 600, price: 900) -> profit per item: 300
    const prodRes = await apiRequest('/products', {
      method: 'POST',
      token,
      body: JSON.stringify({
        name: 'Detergent 3kg',
        sku: `DET-${timestamp}`,
        costPrice: 600,
        price: 900,
        stockQuantity: 50,
        lowStockThreshold: 10
      })
    });
    if (prodRes.status !== 201) logFail('Create Product failed', prodRes.data);
    const productId = prodRes.data.data._id;
    logPass('Setup: Created Product (cost: 600, price: 900, stock: 50)');

    // 4. Record Inventory Sale (Today): 3 units -> total: 2700, cost: 1800, profit: 900
    const sale1Res = await apiRequest('/transactions/sale', {
      method: 'POST',
      token,
      body: JSON.stringify({
        customerId,
        isInventorySale: true,
        items: [{ productId, quantity: 3 }],
        notes: 'Inventory detergent sale'
      })
    });
    if (sale1Res.status !== 201 || sale1Res.data.data?.profitAmount !== 900) {
      logFail('Sale 1 failed', sale1Res.data);
    }
    const saleId1 = sale1Res.data.data._id;
    logPass('Recorded Inventory Sale Today: amount=2700, profit=900');

    // 5. Record Service Sale (Today): amount: 1500, profit: 1500
    const sale2Res = await apiRequest('/transactions/sale', {
      method: 'POST',
      token,
      body: JSON.stringify({
        customerId,
        isInventorySale: false,
        amount: 1500,
        notes: 'Delivery and installation service'
      })
    });
    if (sale2Res.status !== 201 || sale2Res.data.data?.profitAmount !== 1500) {
      logFail('Sale 2 failed', sale2Res.data);
    }
    const saleId2 = sale2Res.data.data._id;
    logPass('Recorded Service Sale Today: amount=1500, profit=1500');

    // Total sales today = 2700 + 1500 = 4200
    // Total gross profit today = 900 + 1500 = 2400

    // 6. Record Active Expenses (Today):
    // Expense A: 800 (Active)
    const exp1Res = await apiRequest('/expenses', {
      method: 'POST',
      token,
      body: JSON.stringify({
        category: 'Packaging',
        amount: 800,
        notes: 'Boxes and wraps'
      })
    });
    if (exp1Res.status !== 201) logFail('Expense 1 failed', exp1Res.data);
    const expId1 = exp1Res.data.data._id;

    // Expense B: 400 (Active)
    const exp2Res = await apiRequest('/expenses', {
      method: 'POST',
      token,
      body: JSON.stringify({
        category: 'Refreshments',
        amount: 400,
        notes: 'Tea and coffee'
      })
    });
    if (exp2Res.status !== 201) logFail('Expense 2 failed', exp2Res.data);
    const expId2 = exp2Res.data.data._id;

    // Expense C: 600 (To be soft-deleted, must NOT be counted in totalExpenses)
    const exp3Res = await apiRequest('/expenses', {
      method: 'POST',
      token,
      body: JSON.stringify({
        category: 'Miscellaneous',
        amount: 600,
        notes: 'To delete'
      })
    });
    if (exp3Res.status !== 201) logFail('Expense 3 failed', exp3Res.data);
    const expId3 = exp3Res.data.data._id;

    // Soft delete Expense C
    const delRes = await apiRequest(`/expenses/${expId3}`, {
      method: 'DELETE',
      token
    });
    if (delRes.status !== 200 || delRes.data.data?.isActive !== false) {
      logFail('Delete Expense 3 failed', delRes.data);
    }
    logPass('Created Expenses: Rs 800 (active), Rs 400 (active), Rs 600 (soft-deleted)');

    // Expected Today:
    // Total Sales: 4200
    // Gross Profit: 2400
    // Total Active Expenses: 800 + 400 = 1200 (soft-deleted 600 excluded)
    // Net Income: 2400 - 1200 = 1200

    // ----------------------------------------------------
    // Test 1: GET /api/dashboard/stats (Default / range=today)
    // ----------------------------------------------------
    const statsTodayRes = await apiRequest('/dashboard/stats?range=today', { token });
    if (statsTodayRes.status !== 200) {
      logFail('GET /api/dashboard/stats?range=today failed', statsTodayRes.data);
    }
    const todayData = statsTodayRes.data.data;

    if (todayData.totalSales !== 4200) {
      logFail(`Expected totalSales=4200, got ${todayData.totalSales}`);
    }
    logPass('Aggregation Pipeline: totalSales correctly sums sales ($group)');

    if (todayData.grossProfit !== 2400 || todayData.profitAmount !== 2400) {
      logFail(`Expected grossProfit/profitAmount=2400, got ${todayData.grossProfit}`);
    }
    logPass('Aggregation Pipeline: grossProfit/profitAmount correctly sums profitAmount ($group)');

    if (todayData.totalExpenses !== 1200) {
      logFail(`Expected totalExpenses=1200 (excluding soft-deleted), got ${todayData.totalExpenses}`);
    }
    logPass('Aggregation Pipeline: totalExpenses sums only active expenses in range ($match + $group)');

    if (todayData.netIncome !== 1200) {
      logFail(`Expected netIncome=1200 (grossProfit - totalExpenses), got ${todayData.netIncome}`);
    }
    logPass('Calculation: netIncome accurately equals grossProfit - totalExpenses (2400 - 1200 = 1200)');

    // ----------------------------------------------------
    // Test 2: GET /api/dashboard/stats (range=week)
    // ----------------------------------------------------
    const statsWeekRes = await apiRequest('/dashboard/stats?range=week', { token });
    if (statsWeekRes.status !== 200) {
      logFail('GET /api/dashboard/stats?range=week failed', statsWeekRes.data);
    }
    const weekData = statsWeekRes.data.data;
    if (weekData.range !== 'week') {
      logFail(`Expected range='week', got ${weekData.range}`);
    }
    if (weekData.totalSales < 4200 || weekData.netIncome !== weekData.grossProfit - weekData.totalExpenses) {
      logFail('Week range metrics calculation mismatch', weekData);
    }
    logPass('Range Filter: range=week aggregation pipeline verified');

    // ----------------------------------------------------
    // Test 3: GET /api/dashboard/stats (range=month)
    // ----------------------------------------------------
    const statsMonthRes = await apiRequest('/dashboard/stats?range=month', { token });
    if (statsMonthRes.status !== 200) {
      logFail('GET /api/dashboard/stats?range=month failed', statsMonthRes.data);
    }
    const monthData = statsMonthRes.data.data;
    if (monthData.range !== 'month') {
      logFail(`Expected range='month', got ${monthData.range}`);
    }
    if (monthData.totalSales < 4200 || monthData.netIncome !== monthData.grossProfit - monthData.totalExpenses) {
      logFail('Month range metrics calculation mismatch', monthData);
    }
    logPass('Range Filter: range=month aggregation pipeline verified');

    // ----------------------------------------------------
    // Test 4: Breakdown Object Structure Verification
    // ----------------------------------------------------
    if (!todayData.breakdown?.today || !todayData.breakdown?.week || !todayData.breakdown?.month) {
      logFail('Breakdown object missing today, week, or month structures', todayData.breakdown);
    }
    if (
      todayData.breakdown.today.totalSales !== 4200 ||
      todayData.breakdown.today.netIncome !== 1200
    ) {
      logFail('breakdown.today metrics mismatch', todayData.breakdown.today);
    }
    logPass('Breakdown Structure: Precalculated metrics for today, week, and month verified');

    // ----------------------------------------------------
    // Test 5: Backwards-Compatibility with Existing Client Fields
    // ----------------------------------------------------
    if (
      todayData.totalReceivables === undefined ||
      todayData.totalSalesToday === undefined ||
      !Array.isArray(todayData.topDebtors) ||
      !Array.isArray(todayData.lowStockItems) ||
      !Array.isArray(todayData.salesLast7Days)
    ) {
      logFail('Missing backwards-compatible dashboard fields', todayData);
    }
    logPass('Backwards-Compatibility: totalReceivables, topDebtors, lowStockItems, salesLast7Days preserved');

    console.log('\n======================================================');
    console.log('  ALL WEEK 2 DAY 3-4 DASHBOARD AGGREGATION TESTS PASSED!');
    console.log('======================================================\n');

    // Clean up test data
    await User.deleteOne({ _id: userId });
    await Customer.deleteOne({ _id: customerId });
    await Product.deleteOne({ _id: productId });
    await Transaction.deleteMany({ _id: { $in: [saleId1, saleId2] } });
    await Expense.deleteMany({ _id: { $in: [expId1, expId2, expId3] } });

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
