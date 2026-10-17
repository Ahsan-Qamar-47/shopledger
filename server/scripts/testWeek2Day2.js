const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../server');
const User = require('../models/User');

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
  console.log('  ShopLedger Week 2 Day 2: Auth & Cashier Reg Tests');
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
    const ownerEmail = `owner-day2-${timestamp}@test.com`;
    const cashierEmail = `cashier-day2-${timestamp}@test.com`;
    const registeredCashierEmail = `registered-cashier-${timestamp}@test.com`;

    // ----------------------------------------------------
    // Setup: Create Owner and Existing Cashier
    // ----------------------------------------------------
    const ownerRegRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Shop Owner Day2',
        email: ownerEmail,
        password: 'Password123!',
        shopName: 'Metro General Store',
        role: 'Owner'
      })
    });
    if (ownerRegRes.status !== 201) logFail('Register Owner failed', ownerRegRes.data);
    const ownerToken = ownerRegRes.data.token;
    logPass('Setup: Registered Owner');

    const cashierRegRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Existing Cashier',
        email: cashierEmail,
        password: 'Password123!',
        shopName: 'Metro General Store',
        role: 'Cashier'
      })
    });
    if (cashierRegRes.status !== 201) logFail('Register Cashier failed', cashierRegRes.data);
    const cashierToken = cashierRegRes.data.token;
    logPass('Setup: Registered Existing Cashier');

    // ----------------------------------------------------
    // Test 1: POST /api/auth/register-cashier Protection
    // ----------------------------------------------------
    // 1a. Missing token -> 401 Unauthorized (verifyToken)
    const noTokenRes = await apiRequest('/auth/register-cashier', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Cashier',
        email: registeredCashierEmail,
        password: 'Password123!'
      })
    });
    if (noTokenRes.status !== 401) {
      logFail('POST /api/auth/register-cashier without token must return 401', noTokenRes);
    }
    logPass('POST /api/auth/register-cashier: verifyToken rejects unauthenticated request (401)');

    // 1b. Invalid token -> 401 Unauthorized (verifyToken)
    const badTokenRes = await apiRequest('/auth/register-cashier', {
      method: 'POST',
      token: 'bad.jwt.token',
      body: JSON.stringify({
        name: 'New Cashier',
        email: registeredCashierEmail,
        password: 'Password123!'
      })
    });
    if (badTokenRes.status !== 401) {
      logFail('POST /api/auth/register-cashier with invalid token must return 401', badTokenRes);
    }
    logPass('POST /api/auth/register-cashier: verifyToken rejects invalid token (401)');

    // 1c. Cashier caller -> 403 Forbidden (checkRole('Owner'))
    const cashierCallerRes = await apiRequest('/auth/register-cashier', {
      method: 'POST',
      token: cashierToken,
      body: JSON.stringify({
        name: 'New Cashier',
        email: registeredCashierEmail,
        password: 'Password123!'
      })
    });
    if (cashierCallerRes.status !== 403) {
      logFail('POST /api/auth/register-cashier with Cashier role must return 403 Forbidden', cashierCallerRes);
    }
    logPass('POST /api/auth/register-cashier: checkRole("Owner") blocks non-owners (403)');

    // 1d. Validation check (short password < 8)
    const invalidBodyRes = await apiRequest('/auth/register-cashier', {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({
        name: 'New Cashier',
        email: registeredCashierEmail,
        password: 'short'
      })
    });
    if (invalidBodyRes.status !== 400) {
      logFail('POST /api/auth/register-cashier with short password must return 400', invalidBodyRes);
    }
    logPass('POST /api/auth/register-cashier: Express-validator enforces password min 8 characters (400)');

    // 1e. Successful Cashier Registration by Owner
    const registerSuccessRes = await apiRequest('/auth/register-cashier', {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({
        name: 'New Registered Cashier',
        email: registeredCashierEmail,
        password: 'Password123!'
      })
    });
    if (
      registerSuccessRes.status !== 201 ||
      registerSuccessRes.data.role !== 'Cashier' ||
      registerSuccessRes.data.user?.role !== 'Cashier' ||
      registerSuccessRes.data.user?.shopName !== 'Metro General Store'
    ) {
      logFail('POST /api/auth/register-cashier failed to create Cashier', registerSuccessRes);
    }
    logPass('POST /api/auth/register-cashier: Owner successfully created Cashier (201, role="Cashier", inherits shopName)');

    // 1f. Duplicate email check
    const duplicateRes = await apiRequest('/auth/register-cashier', {
      method: 'POST',
      token: ownerToken,
      body: JSON.stringify({
        name: 'Duplicate Cashier',
        email: registeredCashierEmail,
        password: 'Password123!'
      })
    });
    if (duplicateRes.status !== 400) {
      logFail('POST /api/auth/register-cashier with existing email must return 400', duplicateRes);
    }
    logPass('POST /api/auth/register-cashier: Rejects duplicate email registration (400)');

    // ----------------------------------------------------
    // Test 2: Login Response Payload Role Field Verification
    // ----------------------------------------------------
    // 2a. Owner Login
    const ownerLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: ownerEmail,
        password: 'Password123!'
      })
    });
    if (
      ownerLoginRes.status !== 200 ||
      ownerLoginRes.data.role !== 'Owner' ||
      ownerLoginRes.data.user?.role !== 'Owner' ||
      !ownerLoginRes.data.token
    ) {
      logFail('POST /api/auth/login Owner response missing role field', ownerLoginRes);
    }
    logPass('POST /api/auth/login: Owner payload verified - includes role="Owner" (root & user)');

    // 2b. Cashier Login (using newly registered cashier)
    const cashierLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: registeredCashierEmail,
        password: 'Password123!'
      })
    });
    if (
      cashierLoginRes.status !== 200 ||
      cashierLoginRes.data.role !== 'Cashier' ||
      cashierLoginRes.data.user?.role !== 'Cashier' ||
      !cashierLoginRes.data.token
    ) {
      logFail('POST /api/auth/login Cashier response missing role field', cashierLoginRes);
    }
    logPass('POST /api/auth/login: Cashier payload verified - includes role="Cashier" (root & user)');

    // 2c. Invalid Login
    const badLoginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: ownerEmail,
        password: 'WrongPassword'
      })
    });
    if (badLoginRes.status !== 401) {
      logFail('POST /api/auth/login with wrong credentials must return 401', badLoginRes);
    }
    logPass('POST /api/auth/login: Invalid credentials rejected (401)');

    console.log('\n======================================================');
    console.log('  ALL WEEK 2 DAY 2 AUTH & CASHIER TESTS PASSED!');
    console.log('======================================================\n');

    // Clean up test data
    await User.deleteMany({
      email: { $in: [ownerEmail, cashierEmail, registeredCashierEmail] }
    });

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
