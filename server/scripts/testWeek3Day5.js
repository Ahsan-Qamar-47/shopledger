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
  console.log('  ShopLedger Week 3 Day 5: Full Integration Test Suite');
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
    const ownerEmail = `owner-week3-${timestamp}@test.com`;
    const cashierEmail = `cashier-week3-${timestamp}@test.com`;
    const shopName = `Al-Rehman Traders ${timestamp}`;

    // -------------------------------------------------------------------------
    // Phase 1: Owner Registration & Cashier Creation
    // -------------------------------------------------------------------------
    const regOwnerRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Haji Rehman Owner',
        email: ownerEmail,
        password: 'OwnerPassword123!',
        shopName,
        role: 'Owner'
      })
    });
    if (regOwnerRes.status !== 201) logFail('Register Owner failed', regOwnerRes.data);
    const ownerToken = regOwnerRes.data.token;
    logPass('Setup: Registered Owner with role="Owner"');

    // Owner creates a Cashier via /api/auth/register-cashier
    const regCashierRes = await apiRequest('/auth/register-cashier', {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({
        name: 'Asad Cashier',
        email: cashierEmail,
        password: 'CashierPassword123!'
      })
    });
    if (regCashierRes.status !== 201) logFail('Owner register-cashier failed', regCashierRes.data);
    logPass('Setup: Owner registered Cashier via POST /api/auth/register-cashier');

    // Owner seeds a test product and customer
    const ownerUser = await User.findOne({ email: ownerEmail });
    const product = await Product.create({
      userId: ownerUser._id,
      name: 'Super Basmati Rice 5kg',
      sku: `RICE-${timestamp}`,
      costPrice: 800,
      price: 1200,
      stockQuantity: 40,
      lowStockThreshold: 10
    });
    logPass('Setup: Seeded product (cost: 800, price: 1200, stock: 40)');

    const customer = await Customer.create({
      userId: ownerUser._id,
      name: 'Tariq Mehmood',
      phone: '03001234567',
      totalBalance: 0
    });
    logPass('Setup: Seeded customer (initial balance: 0)');

    // -------------------------------------------------------------------------
    // Phase 2: Cashier Flow Testing
    // -------------------------------------------------------------------------
    // 1. Cashier Login
    const cashierLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: cashierEmail,
        password: 'CashierPassword123!'
      })
    });
    if (cashierLoginRes.status !== 200) logFail('Cashier Login failed', cashierLoginRes.data);
    if (cashierLoginRes.data.role !== 'Cashier' || cashierLoginRes.data.user.role !== 'Cashier') {
      logFail('Cashier payload did not return role="Cashier"', cashierLoginRes.data);
    }
    const cashierToken = cashierLoginRes.data.token;
    logPass('Cashier Flow: Login successful, payload confirmed role="Cashier"');

    // 2. Cashier blocked from Expense routes (403 Forbidden)
    const cashierGetExpenses = await apiRequest('/expenses', {
      method: 'GET',
      token: cashierToken
    });
    if (cashierGetExpenses.status !== 403) {
      logFail('Cashier was not blocked from GET /expenses', cashierGetExpenses);
    }
    logPass('Cashier Flow: GET /api/expenses strictly blocked with 403 Forbidden');

    const cashierPostExpense = await apiRequest('/expenses', {
      method: 'POST',
      token: cashierToken,
      body: JSON.stringify({
        category: 'Utilities',
        amount: 2500,
        notes: 'Unauthorized bill'
      })
    });
    if (cashierPostExpense.status !== 403) {
      logFail('Cashier was not blocked from POST /expenses', cashierPostExpense);
    }
    logPass('Cashier Flow: POST /api/expenses strictly blocked with 403 Forbidden');

    // 3. Cashier blocked from Registering other Cashiers (403 Forbidden)
    const cashierRegisterAnother = await apiRequest('/auth/register-cashier', {
      method: 'POST',
      token: cashierToken,
      body: JSON.stringify({
        name: 'Rogue Cashier',
        email: `rogue-${timestamp}@test.com`,
        password: 'Password123!'
      })
    });
    if (cashierRegisterAnother.status !== 403) {
      logFail('Cashier was not blocked from register-cashier', cashierRegisterAnother);
    }
    logPass('Cashier Flow: POST /api/auth/register-cashier strictly blocked with 403 Forbidden');

    // 4. Cashier fetches operational stats
    const cashierStatsRes = await apiRequest('/dashboard/cashier-stats', {
      method: 'GET',
      token: cashierToken
    });
    if (cashierStatsRes.status !== 200) logFail('Cashier stats failed', cashierStatsRes.data);
    const cashierStats = cashierStatsRes.data.data;
    if (
      cashierStats.grossProfit !== undefined ||
      cashierStats.totalExpenses !== undefined ||
      cashierStats.netIncome !== undefined
    ) {
      logFail('Cashier stats leaked financial metrics', cashierStats);
    }
    logPass('Cashier Flow: GET /api/dashboard/cashier-stats excludes all financial metrics');

    // 5. Cashier records an Inventory Sale (Udhaar)
    const inventorySaleRes = await apiRequest('/transactions/sale', {
      method: 'POST',
      token: cashierToken,
      body: JSON.stringify({
        customerId: customer._id,
        isInventorySale: true,
        items: [{ productId: product._id, quantity: 2 }],
        notes: 'Cashier sale of 2 rice bags'
      })
    });
    if (inventorySaleRes.status !== 201) logFail('Cashier inventory sale failed', inventorySaleRes.data);
    logPass('Cashier Flow: Successfully recorded Inventory Sale (amount: 2400, stock -2)');

    // Verify stock and balance
    const updatedProdAfterSale = await Product.findById(product._id);
    if (updatedProdAfterSale.stockQuantity !== 38) {
      logFail(`Product stock should be 38, got ${updatedProdAfterSale.stockQuantity}`);
    }
    const updatedCustAfterSale = await Customer.findById(customer._id);
    if (updatedCustAfterSale.totalBalance !== 2400) {
      logFail(`Customer balance should be 2400, got ${updatedCustAfterSale.totalBalance}`);
    }
    logPass('Cashier Flow: Verified product stock decremented & customer balance updated');

    // 6. Cashier records a Service Sale (Tailoring / Alteration fee)
    const serviceSaleRes = await apiRequest('/transactions/sale', {
      method: 'POST',
      token: cashierToken,
      body: JSON.stringify({
        customerId: customer._id,
        isInventorySale: false,
        amount: 600,
        notes: 'Delivery and packing service charge'
      })
    });
    if (serviceSaleRes.status !== 201) logFail('Cashier service sale failed', serviceSaleRes.data);
    logPass('Cashier Flow: Successfully recorded Service Sale (amount: 600, pure profit)');

    const updatedProdAfterService = await Product.findById(product._id);
    if (updatedProdAfterService.stockQuantity !== 38) {
      logFail('Stock should NOT be decremented on service sale');
    }
    const updatedCustAfterService = await Customer.findById(customer._id);
    if (updatedCustAfterService.totalBalance !== 3000) {
      logFail(`Customer balance should be 3000 (2400+600), got ${updatedCustAfterService.totalBalance}`);
    }
    logPass('Cashier Flow: Verified stock untouched and customer balance incremented to 3000');

    // -------------------------------------------------------------------------
    // Phase 3: Owner Flow Testing
    // -------------------------------------------------------------------------
    // 1. Owner Login
    const ownerLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: ownerEmail,
        password: 'OwnerPassword123!'
      })
    });
    if (ownerLoginRes.status !== 200) logFail('Owner login failed', ownerLoginRes.data);
    logPass('Owner Flow: Login successful, authenticated as Owner');

    // 2. Owner checks initial dashboard stats before logging expenses
    const dashBeforeExp = await apiRequest('/dashboard/stats?range=today', {
      method: 'GET',
      token: ownerToken
    });
    if (dashBeforeExp.status !== 200) logFail('Owner dashboard failed', dashBeforeExp.data);
    const metricsBefore = dashBeforeExp.data.data;
    // Expected:
    // Inventory sale profit: 2 * (1200 - 800) = 800
    // Service sale profit: 600
    // Total gross profit = 1400
    // Total expenses = 0
    // Net Income = 1400
    if (metricsBefore.grossProfit !== 1400) {
      logFail(`Expected grossProfit 1400, got ${metricsBefore.grossProfit}`);
    }
    if (metricsBefore.totalExpenses !== 0) {
      logFail(`Expected totalExpenses 0, got ${metricsBefore.totalExpenses}`);
    }
    if (metricsBefore.netIncome !== 1400) {
      logFail(`Expected netIncome 1400, got ${metricsBefore.netIncome}`);
    }
    logPass('Owner Flow: Dashboard stats before expense verified (Gross: 1400, Exp: 0, Net: 1400)');

    // 3. Owner adds an Expense: Rent Rs. 1000
    const addExpenseRes = await apiRequest('/expenses', {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({
        category: 'Rent',
        amount: 1000,
        date: new Date().toISOString(),
        notes: 'Shop partial rent payment'
      })
    });
    if (addExpenseRes.status !== 201) logFail('Owner add expense failed', addExpenseRes.data);
    const createdExpenseId = addExpenseRes.data.data._id;
    logPass('Owner Flow: Successfully created Expense (Rent: Rs. 1000)');

    // 4. Owner views updated Dashboard Profit
    const dashAfterExp = await apiRequest('/dashboard/stats?range=today', {
      method: 'GET',
      token: ownerToken
    });
    if (dashAfterExp.status !== 200) logFail('Owner dashboard after expense failed', dashAfterExp.data);
    const metricsAfter = dashAfterExp.data.data;
    // Expected:
    // Gross Profit: 1400
    // Total Expenses: 1000
    // Net Income = 1400 - 1000 = 400
    if (metricsAfter.grossProfit !== 1400) {
      logFail(`Expected grossProfit 1400, got ${metricsAfter.grossProfit}`);
    }
    if (metricsAfter.totalExpenses !== 1000) {
      logFail(`Expected totalExpenses 1000, got ${metricsAfter.totalExpenses}`);
    }
    if (metricsAfter.netIncome !== 400) {
      logFail(`Expected netIncome 400, got ${metricsAfter.netIncome}`);
    }
    logPass('Owner Flow: Dashboard Profit accurately updated (Gross: 1400 - Exp: 1000 = Net: 400)');

    // 5. Owner checks cashiers listing
    const cashiersListRes = await apiRequest('/auth/cashiers', {
      method: 'GET',
      token: ownerToken
    });
    if (cashiersListRes.status !== 200) logFail('Owner get cashiers failed', cashiersListRes.data);
    if (!cashiersListRes.data.cashiers.some((c) => c.email === cashierEmail)) {
      logFail('Registered cashier not found in cashiers list', cashiersListRes.data);
    }
    logPass('Owner Flow: Verified registered cashier listed in GET /api/auth/cashiers');

    // 6. Owner soft-deletes the expense and verifies Net Income recovery
    const deleteExpRes = await apiRequest(`/expenses/${createdExpenseId}`, {
      method: 'DELETE',
      token: ownerToken
    });
    if (deleteExpRes.status !== 200) logFail('Delete expense failed', deleteExpRes.data);
    logPass('Owner Flow: Soft-deleted expense (isActive: false)');

    const dashAfterDelete = await apiRequest('/dashboard/stats?range=today', {
      method: 'GET',
      token: ownerToken
    });
    const metricsAfterDelete = dashAfterDelete.data.data;
    if (metricsAfterDelete.totalExpenses !== 0) {
      logFail(`Soft-deleted expense was not excluded, totalExpenses is ${metricsAfterDelete.totalExpenses}`);
    }
    if (metricsAfterDelete.netIncome !== 1400) {
      logFail(`Net income should have recovered to 1400, got ${metricsAfterDelete.netIncome}`);
    }
    logPass('Owner Flow: Soft-deleted expense excluded from totals, Net Income recovered to 1400');

    console.log('\n======================================================');
    console.log('  ALL WEEK 3 DAY 5 FULL INTEGRATION TESTS PASSED!');
    console.log('======================================================\n');
  } catch (error) {
    logFail('Unexpected error during test execution', error);
  } finally {
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}

runTests();
