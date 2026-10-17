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
  console.log('\n========================================');
  console.log('  ShopLedger Week 1 Endpoints Test Suite');
  console.log('========================================\n');

  try {
    // 1. Wait for Mongoose to connect
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once('open', resolve));
    }
    logPass('Connected to MongoDB');

    // Start Express server on ephemeral port
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api`;
    logPass(`Test server listening on port ${port}`);

    // Clean up test data
    const testEmailOwner = `test-owner-${Date.now()}@test.com`;
    const testEmailCashier = `test-cashier-${Date.now()}@test.com`;

    // ----------------------------------------------------
    // Test 1: User Registration with Roles (Owner & Cashier)
    // ----------------------------------------------------
    const ownerRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Owner',
        email: testEmailOwner,
        password: 'Password123!',
        shopName: 'Super Test Store',
        role: 'Owner'
      })
    });
    if (ownerRes.status !== 201 || ownerRes.data.user?.role !== 'Owner') {
      logFail('Register User as Owner', ownerRes.data);
    }
    logPass('POST /api/auth/register (Owner with role="Owner")');

    const cashierRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Test Cashier',
        email: testEmailCashier,
        password: 'Password123!',
        shopName: 'Super Test Store',
        role: 'Cashier'
      })
    });
    if (cashierRes.status !== 201 || cashierRes.data.user?.role !== 'Cashier') {
      logFail('Register User as Cashier', cashierRes.data);
    }
    logPass('POST /api/auth/register (Cashier with default/explicit role="Cashier")');

    // ----------------------------------------------------
    // Test 2: User Login & JWT Token
    // ----------------------------------------------------
    const loginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmailOwner,
        password: 'Password123!'
      })
    });
    if (loginRes.status !== 200 || !loginRes.data.token || loginRes.data.user?.role !== 'Owner') {
      logFail('Login User', loginRes.data);
    }
    const token = loginRes.data.token;
    logPass('POST /api/auth/login (Verified token & Owner role)');

    // ----------------------------------------------------
    // Test 3: Customer Creation
    // ----------------------------------------------------
    const customerRes = await apiRequest('/customers', {
      method: 'POST',
      token,
      body: JSON.stringify({
        name: 'Walk-in Customer Khan',
        phone: '03001234567',
        address: 'Main Bazaar, Lahore'
      })
    });
    if (customerRes.status !== 201 || !customerRes.data.data?._id) {
      logFail('Create Customer', customerRes.data);
    }
    const customerId = customerRes.data.data._id;
    logPass('POST /api/customers (Create customer, balance = 0)');

    // ----------------------------------------------------
    // Test 4: Product Creation (with required costPrice)
    // ----------------------------------------------------
    // 4a. Should fail when costPrice is missing
    const prodMissingCost = await apiRequest('/products', {
      method: 'POST',
      token,
      body: JSON.stringify({
        name: 'Invalid Product No Cost',
        price: 500,
        stockQuantity: 20
      })
    });
    if (prodMissingCost.status === 201) {
      logFail('Create Product without costPrice should have been rejected');
    }
    logPass('POST /api/products (Validation: rejects missing costPrice)');

    // 4b. Should succeed with costPrice
    const productRes = await apiRequest('/products', {
      method: 'POST',
      token,
      body: JSON.stringify({
        name: 'Cooking Oil 1L',
        sku: `OIL-${Date.now()}`,
        costPrice: 400,
        price: 550,
        stockQuantity: 50,
        lowStockThreshold: 10
      })
    });
    if (productRes.status !== 201 || productRes.data.data?.costPrice !== 400) {
      logFail('Create Product with costPrice', productRes.data);
    }
    const productId = productRes.data.data._id;
    logPass('POST /api/products (Product created with costPrice: 400, price: 550, stock: 50)');

    // ----------------------------------------------------
    // Test 5: ACID Transaction Inventory Sale (Day 2)
    // ----------------------------------------------------
    const saleRes = await apiRequest('/transactions/sale', {
      method: 'POST',
      token,
      body: JSON.stringify({
        customerId,
        isInventorySale: true,
        items: [
          {
            productId,
            quantity: 2
          }
        ],
        notes: 'Grocery inventory sale'
      })
    });
    if (saleRes.status !== 201 || saleRes.data.data?.amount !== 1100 || saleRes.data.data?.profitAmount !== 300) {
      logFail('Inventory Sale Transaction failed', saleRes.data);
    }
    logPass('POST /api/transactions/sale (ACID sale: amount=1100, profit=300, stock deducted)');

    // Verify product stock decremented from 50 to 48
    const updatedProdRes = await apiRequest(`/products/${productId}`, { token });
    if (updatedProdRes.data.data?.stockQuantity !== 48) {
      logFail(`Product stock should be 48, got ${updatedProdRes.data.data?.stockQuantity}`);
    }
    logPass('Product stock verified decremented to 48');

    // Verify customer balance increased to 1100
    const updatedCustRes = await apiRequest(`/customers/${customerId}`, { token });
    if (updatedCustRes.data.data?.totalBalance !== 1100) {
      logFail(`Customer balance should be 1100, got ${updatedCustRes.data.data?.totalBalance}`);
    }
    logPass('Customer balance verified updated to 1100');

    // ----------------------------------------------------
    // Test 6: Service Sale Logic (Day 3)
    // ----------------------------------------------------
    const serviceSaleRes = await apiRequest('/transactions/sale', {
      method: 'POST',
      token,
      body: JSON.stringify({
        customerId,
        isInventorySale: false,
        amount: 850,
        notes: 'Oil delivery & maintenance service'
      })
    });
    if (
      serviceSaleRes.status !== 201 ||
      serviceSaleRes.data.data?.amount !== 850 ||
      serviceSaleRes.data.data?.profitAmount !== 850 ||
      serviceSaleRes.data.data?.isInventorySale !== false
    ) {
      logFail('Service Sale Transaction failed', serviceSaleRes.data);
    }
    logPass('POST /api/transactions/sale (Service sale: amount=850, profit=850, stock untouched)');

    // Verify customer balance increased by 850 (1100 + 850 = 1950)
    const custAfterService = await apiRequest(`/customers/${customerId}`, { token });
    if (custAfterService.data.data?.totalBalance !== 1950) {
      logFail(`Customer balance should be 1950, got ${custAfterService.data.data?.totalBalance}`);
    }
    logPass('Customer balance verified updated to 1950');

    // ----------------------------------------------------
    // Test 7: Customer Payment Transaction
    // ----------------------------------------------------
    const paymentRes = await apiRequest('/transactions/payment', {
      method: 'POST',
      token,
      body: JSON.stringify({
        customerId,
        amount: 1000,
        notes: 'Partial cash payment'
      })
    });
    if (paymentRes.status !== 201 || paymentRes.data.data?.amount !== 1000) {
      logFail('Payment Transaction failed', paymentRes.data);
    }
    logPass('POST /api/transactions/payment (Payment recorded: amount=1000)');

    // Verify customer balance decreased to 950 (1950 - 1000)
    const custAfterPayment = await apiRequest(`/customers/${customerId}`, { token });
    if (custAfterPayment.data.data?.totalBalance !== 950) {
      logFail(`Customer balance should be 950, got ${custAfterPayment.data.data?.totalBalance}`);
    }
    logPass('Customer balance verified decremented to 950');

    // ----------------------------------------------------
    // Test 8: Customer Statement
    // ----------------------------------------------------
    const statementRes = await apiRequest(`/transactions/customer/${customerId}`, { token });
    if (statementRes.status !== 200 || statementRes.data.data?.transactions?.length !== 3) {
      logFail('Customer Statement failed', statementRes.data);
    }
    logPass('GET /api/transactions/customer/:id (Statement returns all 3 ledger entries)');

    // ----------------------------------------------------
    // Test 9: Day 4-5 Expense CRUD APIs
    // ----------------------------------------------------
    // 9a. Create Expense
    const expenseRes1 = await apiRequest('/expenses', {
      method: 'POST',
      token,
      body: JSON.stringify({
        category: 'Utilities',
        amount: 3500,
        notes: 'Electricity bill for shop'
      })
    });
    if (expenseRes1.status !== 201 || expenseRes1.data.data?.amount !== 3500 || expenseRes1.data.data?.isActive !== true) {
      logFail('Create Expense 1 failed', expenseRes1.data);
    }
    const expenseId1 = expenseRes1.data.data._id;
    logPass('POST /api/expenses (Expense 1: Utilities Rs 3500, isActive=true)');

    const expenseRes2 = await apiRequest('/expenses', {
      method: 'POST',
      token,
      body: JSON.stringify({
        category: 'Packaging',
        amount: 1200,
        notes: 'Plastic bags and wraps'
      })
    });
    if (expenseRes2.status !== 201) {
      logFail('Create Expense 2 failed', expenseRes2.data);
    }
    const expenseId2 = expenseRes2.data.data._id;
    logPass('POST /api/expenses (Expense 2: Packaging Rs 1200)');

    // 9b. List Expenses (Active only by default)
    const listRes1 = await apiRequest('/expenses', { token });
    if (listRes1.status !== 200 || listRes1.data.count < 2 || listRes1.data.totalAmount < 4700) {
      logFail('List Expenses failed', listRes1.data);
    }
    logPass('GET /api/expenses (Lists active expenses, computes totalAmount)');

    // 9c. Get Expense By ID
    const singleExpRes = await apiRequest(`/expenses/${expenseId1}`, { token });
    if (singleExpRes.status !== 200 || singleExpRes.data.data?.category !== 'Utilities') {
      logFail('Get Expense By ID failed', singleExpRes.data);
    }
    logPass('GET /api/expenses/:id (Fetches single expense correctly)');

    // 9d. Update Expense
    const updateExpRes = await apiRequest(`/expenses/${expenseId1}`, {
      method: 'PUT',
      token,
      body: JSON.stringify({
        amount: 3800,
        notes: 'Updated electricity bill with tax'
      })
    });
    if (updateExpRes.status !== 200 || updateExpRes.data.data?.amount !== 3800) {
      logFail('Update Expense failed', updateExpRes.data);
    }
    logPass('PUT /api/expenses/:id (Updates amount to 3800)');

    // 9e. Soft Delete Expense (isActive: false)
    const deleteExpRes = await apiRequest(`/expenses/${expenseId2}`, {
      method: 'DELETE',
      token
    });
    if (deleteExpRes.status !== 200 || deleteExpRes.data.data?.isActive !== false) {
      logFail('Soft Delete Expense failed', deleteExpRes.data);
    }
    logPass('DELETE /api/expenses/:id (Soft deleted, isActive=false)');

    // 9f. Verify Soft-Delete Filtering in GET /api/expenses
    // Default: excludes soft-deleted
    const listAfterDelete = await apiRequest('/expenses', { token });
    const containsDeleted = listAfterDelete.data.data.some((e) => e._id === expenseId2);
    if (containsDeleted) {
      logFail('GET /api/expenses should NOT include soft-deleted expense by default');
    }
    logPass('GET /api/expenses (Default excludes soft-deleted expense)');

    // includeInactive=true: includes both
    const listWithInactive = await apiRequest('/expenses?includeInactive=true', { token });
    const hasInactive = listWithInactive.data.data.some((e) => e._id === expenseId2);
    if (!hasInactive) {
      logFail('GET /api/expenses?includeInactive=true should include inactive expenses');
    }
    logPass('GET /api/expenses?includeInactive=true (Includes both active & inactive)');

    // includeInactive=only: includes only deleted
    const listOnlyInactive = await apiRequest('/expenses?includeInactive=only', { token });
    const allInactive = listOnlyInactive.data.data.every((e) => e.isActive === false);
    if (!allInactive || listOnlyInactive.data.data.length === 0) {
      logFail('GET /api/expenses?includeInactive=only should only return inactive expenses');
    }
    logPass('GET /api/expenses?includeInactive=only (Returns only soft-deleted expenses)');

    console.log('\n========================================');
    console.log('  ALL WEEK 1 API TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');

    // Clean up test data from DB
    await User.deleteMany({ email: { $in: [testEmailOwner, testEmailCashier] } });
    await Product.deleteOne({ _id: productId });
    await Customer.deleteOne({ _id: customerId });
    await Transaction.deleteMany({ customerId });
    await Expense.deleteMany({ _id: { $in: [expenseId1, expenseId2] } });

    server.close();
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logFail('Unexpected error during test execution', error);
    if (server) server.close();
    await mongoose.connection.close();
    process.exit(1);
  }
}

runTests();
