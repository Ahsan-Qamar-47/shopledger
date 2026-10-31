const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
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
  console.log('\n========================================');
  console.log('  ShopLedger Week 2 Day 1: RBAC Test Suite');
  console.log('========================================\n');

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
    const ownerEmail = `owner-${timestamp}@test.com`;
    const cashierEmail = `cashier-${timestamp}@test.com`;
    const newCashierEmail1 = `sub-cashier-1-${timestamp}@test.com`;
    const newCashierEmail2 = `sub-cashier-2-${timestamp}@test.com`;

    // ----------------------------------------------------
    // Setup: Register Owner and Cashier
    // ----------------------------------------------------
    const regOwner = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Master Owner',
        email: ownerEmail,
        password: 'Password123!',
        shopName: 'Super Mega Shop',
        role: 'Owner'
      })
    });
    if (regOwner.status !== 201) logFail('Register Owner failed', regOwner.data);
    const ownerToken = regOwner.data.token;
    const ownerId = regOwner.data.user.id;
    logPass('Setup: Registered Owner and acquired token');

    const regCashier = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Floor Cashier',
        email: cashierEmail,
        password: 'Password123!',
        shopName: 'Super Mega Shop',
        role: 'Cashier'
      })
    });
    if (regCashier.status !== 201) logFail('Register Cashier failed', regCashier.data);
    const cashierToken = regCashier.data.token;
    const cashierId = regCashier.data.user.id;
    logPass('Setup: Registered Cashier and acquired token');

    // Create a product and customer owned by Owner for testing deletion
    const prodRes = await apiRequest('/products', {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({
        name: 'RBAC Test Product',
        sku: `SKU-${timestamp}`,
        costPrice: 100,
        price: 150,
        stockQuantity: 20
      })
    });
    if (prodRes.status !== 201) logFail('Create Test Product failed', prodRes.data);
    const productId = prodRes.data.data._id;

    const custRes = await apiRequest('/customers', {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({
        name: 'RBAC Test Customer',
        phone: '03009998877'
      })
    });
    if (custRes.status !== 201) logFail('Create Test Customer failed', custRes.data);
    const customerId = custRes.data.data._id;
    logPass('Setup: Seeded test product and customer under Owner');

    // ----------------------------------------------------
    // Test 1: verifyToken / protect Middleware Checks
    // ----------------------------------------------------
    const noTokenRes = await apiRequest('/expenses');
    if (noTokenRes.status !== 401) {
      logFail('Route without token should return 401 Unauthorized', noTokenRes);
    }
    logPass('verifyToken: Missing token returns 401 Unauthorized');

    const badTokenRes = await apiRequest('/expenses', {
      token: 'invalid.jwt.token'
    });
    if (badTokenRes.status !== 401) {
      logFail('Route with invalid token should return 401 Unauthorized', badTokenRes);
    }
    logPass('verifyToken: Invalid token returns 401 Unauthorized');

    // ----------------------------------------------------
    // Test 2: RBAC checkRole('Owner') - Cashier Denied 403
    // ----------------------------------------------------
    // 2a. Cashier denied POST /api/expenses
    const cashierExpPost = await apiRequest('/expenses', {
      method: 'POST',
      token: cashierToken,
      body: JSON.stringify({
        category: 'Supplies',
        amount: 500
      })
    });
    if (cashierExpPost.status !== 403) {
      logFail('Cashier POST /api/expenses should return 403 Forbidden', cashierExpPost);
    }
    logPass('RBAC: Cashier denied POST /api/expenses (403 Forbidden)');

    // 2b. Cashier denied GET /api/expenses
    const cashierExpGet = await apiRequest('/expenses', {
      token: cashierToken
    });
    if (cashierExpGet.status !== 403) {
      logFail('Cashier GET /api/expenses should return 403 Forbidden', cashierExpGet);
    }
    logPass('RBAC: Cashier denied GET /api/expenses (403 Forbidden)');

    // 2c. Cashier denied DELETE /api/customers/:id
    const cashierCustDelete = await apiRequest(`/customers/${customerId}`, {
      method: 'DELETE',
      token: cashierToken
    });
    if (cashierCustDelete.status !== 403) {
      logFail('Cashier DELETE /api/customers/:id should return 403 Forbidden', cashierCustDelete);
    }
    logPass('RBAC: Cashier denied DELETE /api/customers/:id (403 Forbidden)');

    // 2d. Cashier denied DELETE /api/products/:id
    const cashierProdDelete = await apiRequest(`/products/${productId}`, {
      method: 'DELETE',
      token: cashierToken
    });
    if (cashierProdDelete.status !== 403) {
      logFail('Cashier DELETE /api/products/:id should return 403 Forbidden', cashierProdDelete);
    }
    logPass('RBAC: Cashier denied DELETE /api/products/:id (403 Forbidden)');

    // 2e. Cashier denied POST /api/auth/register-cashier
    const cashierRegCashier = await apiRequest('/auth/register-cashier', {
      method: 'POST',
      token: cashierToken,
      body: JSON.stringify({
        name: 'Unauthorized Cashier',
        email: newCashierEmail1,
        password: 'Password123!'
      })
    });
    if (cashierRegCashier.status !== 403) {
      logFail('Cashier POST /api/auth/register-cashier should return 403 Forbidden', cashierRegCashier);
    }
    logPass('RBAC: Cashier denied POST /api/auth/register-cashier (403 Forbidden)');

    // ----------------------------------------------------
    // Test 3: RBAC checkRole('Owner') - Owner Granted Access
    // ----------------------------------------------------
    // 3a. Owner can POST /api/expenses
    const ownerExpPost = await apiRequest('/expenses', {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({
        category: 'Rent',
        amount: 25000,
        notes: 'Monthly store rent'
      })
    });
    if (ownerExpPost.status !== 201) {
      logFail('Owner POST /api/expenses should succeed with 201', ownerExpPost);
    }
    const createdExpenseId = ownerExpPost.data.data._id;
    logPass('RBAC: Owner granted POST /api/expenses (201 Created)');

    // 3b. Owner can GET /api/expenses
    const ownerExpGet = await apiRequest('/expenses', {
      token: ownerToken
    });
    if (ownerExpGet.status !== 200 || ownerExpGet.data.count < 1) {
      logFail('Owner GET /api/expenses should succeed with 200', ownerExpGet);
    }
    logPass('RBAC: Owner granted GET /api/expenses (200 OK)');

    // 3c. Owner can POST /api/auth/register-cashier
    const ownerRegCashier1 = await apiRequest('/auth/register-cashier', {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({
        name: 'Authorized Cashier One',
        email: newCashierEmail1,
        password: 'Password123!'
      })
    });
    if (ownerRegCashier1.status !== 201 || ownerRegCashier1.data.user?.role !== 'Cashier') {
      logFail('Owner POST /api/auth/register-cashier should succeed with 201 and role Cashier', ownerRegCashier1);
    }
    logPass('RBAC: Owner successfully registered Cashier via POST /api/auth/register-cashier');

    // 3d. Owner can POST /api/register-cashier (root mount alias)
    const ownerRegCashier2 = await apiRequest('/register-cashier', {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({
        name: 'Authorized Cashier Two',
        email: newCashierEmail2,
        password: 'Password123!'
      })
    });
    if (ownerRegCashier2.status !== 201 || ownerRegCashier2.data.user?.role !== 'Cashier') {
      logFail('Owner POST /api/register-cashier should succeed with 201', ownerRegCashier2);
    }
    logPass('RBAC: Owner successfully registered Cashier via POST /api/register-cashier alias');

    // 3e. Owner can DELETE /api/customers/:id
    const ownerCustDelete = await apiRequest(`/customers/${customerId}`, {
      method: 'DELETE',
      token: ownerToken
    });
    if (ownerCustDelete.status !== 200) {
      logFail('Owner DELETE /api/customers/:id should succeed with 200', ownerCustDelete);
    }
    logPass('RBAC: Owner granted DELETE /api/customers/:id (200 OK)');

    // 3f. Owner can DELETE /api/products/:id
    const ownerProdDelete = await apiRequest(`/products/${productId}`, {
      method: 'DELETE',
      token: ownerToken
    });
    if (ownerProdDelete.status !== 200) {
      logFail('Owner DELETE /api/products/:id should succeed with 200', ownerProdDelete);
    }
    logPass('RBAC: Owner granted DELETE /api/products/:id (200 OK)');

    console.log('\n========================================');
    console.log('  ALL WEEK 2 DAY 1 RBAC TESTS PASSED!');
    console.log('========================================\n');

    // Clean up test data
    await User.deleteMany({
      email: { $in: [ownerEmail, cashierEmail, newCashierEmail1, newCashierEmail2] }
    });
    await Product.deleteOne({ _id: productId });
    await Customer.deleteOne({ _id: customerId });
    await Expense.deleteOne({ _id: createdExpenseId });

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
