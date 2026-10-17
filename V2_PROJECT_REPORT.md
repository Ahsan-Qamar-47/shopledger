# ShopLedger V2 - Technical Project Report

**Course**: ST-315-L Project-I  
**Project**: ShopLedger V2 (Enterprise Khata, Inventory & Profit Intelligence System)  
**Version**: 2.0.0 (Production Release)  
**Target Branch**: `v2`  

---

## 1. Executive Summary

ShopLedger V2 represents a major architectural evolution from the initial V1 single-user ledger into a multi-role, business-intelligence-driven khata and inventory platform. Small-to-medium retail and service shops require strict segregation between financial administrative capabilities (such as profit margins, overhead expenses, and staff administration) and operational floor activities (such as recording sales, accepting customer payments, and issuing receipts).

ShopLedger V2 addresses this requirement by implementing:
1. **Multi-Document ACID Transactions** utilizing MongoDB sessions to guarantee atomicity and data consistency across inventory stock, customer balances, and immutable transaction ledgers.
2. **Role-Based Access Control (RBAC)** enforcing distinct privileges between `Owner` and `Cashier` roles across backend API middleware and frontend UI navigation.
3. **Enterprise Expense Management** with categorization, soft deletion, and automated deduction from gross earnings.
4. **Service Sales Architecture** introducing non-inventory revenue streams (such as repair work, maintenance, and consultations) calculated as pure profit without stock decrements.
5. **Real-Time Financial Intelligence Aggregation** with MongoDB `$facet` pipelines, date range filtering (Today, This Week, This Month), and historical time-series analytics visualized via Recharts.
6. **Production Deployment & Keep-Alive Architecture** deployed on Render and Vercel with automated zero-downtime health checking.

---

## 2. System Architecture

ShopLedger V2 employs a modern MERN architecture engineered for high concurrency, data isolation, and strict role segregation.

```
                      +---------------------------------------+
                      |     Client Layer (React 19 / Vite)    |
                      |  - Plus Jakarta Sans & Fraunces UI    |
                      |  - Dynamic Role-Based Navigation      |
                      |  - Recharts Time-Series Charts        |
                      |  - Axios 403 Interceptor & Toasts     |
                      +-------------------+-------------------+
                                          |
                                    HTTPS / JSON
                                          |
                                          v
                      +---------------------------------------+
                      |     Server Layer (Express 5 / Node)   |
                      |  - Helmet & MongoSanitize Security    |
                      |  - JWT verifyToken Authentication     |
                      |  - RBAC checkRole('Owner') Pipeline   |
                      |  - Express-Validator Input Gateways   |
                      +-------------------+-------------------+
                                          |
                             Mongoose Multi-Doc Session
                                          |
                                          v
                      +---------------------------------------+
                      |     Database Layer (MongoDB Atlas)    |
                      |  - 3-Node Replica Set (ACID Engine)   |
                      |  - Aggregation Pipelines ($match)     |
                      |  - Collections: Users, Products,      |
                      |    Customers, Transactions, Expenses  |
                      +---------------------------------------+
```

---

## 3. Core Architectural Highlights

### 3.1 Multi-Document ACID Transactions

In high-volume retail environments, recording a sale requires atomic updates across multiple collections:
1. Deducting quantity from the `Product` collection.
2. Increasing customer receivable debt in the `Customer` collection.
3. Appending an immutable audit entry in the `Transaction` collection.

If a failure occurs during any intermediate step (for example, a database network glitch, or an item falling below stock threshold), a non-transactional database leaves corrupted state: inventory is decremented without an audit record, or customer debt is not registered.

ShopLedger V2 solves this by executing transactions inside a **MongoDB Client Session**:

```javascript
// server/controllers/transactionController.js
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 1. Validate and atomically deduct stock for inventory items
  if (isInventorySale) {
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.productId, userId: req.user._id, stockQuantity: { $gte: item.quantity } },
        { $inc: { stockQuantity: -item.quantity } },
        { session, new: true }
      );
      if (!product) {
        throw new Error(`Insufficient stock for item: ${item.name}`);
      }
    }
  }

  // 2. Atomically update Customer balance
  const customer = await Customer.findOneAndUpdate(
    { _id: customerId, userId: req.user._id },
    { $inc: { totalBalance: totalAmount } },
    { session, new: true }
  );

  // 3. Record transaction ledger entry
  const transaction = new Transaction({
    userId: req.user._id,
    customerId,
    type: 'SALE',
    amount: totalAmount,
    isInventorySale,
    profitAmount,
    items,
    balanceAfter: customer.totalBalance
  });
  await transaction.save({ session });

  // Commit all changes atomically
  await session.commitTransaction();
} catch (error) {
  // Rollback all modifications if any failure occurs
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

#### ACID Guarantees:
- **Atomicity**: Either all inventory deductions, customer balance updates, and transaction records succeed, or none are applied.
- **Consistency**: Prevents negative stock via `{ stockQuantity: { $gte: item.quantity } }` atomic filters.
- **Isolation**: Concurrent read and write operations do not see intermediate dirty state.
- **Durability**: Committed transactions are permanently written to write-ahead logs on MongoDB Atlas replica nodes.

---

### 3.2 Role-Based Access Control (RBAC) Architecture

ShopLedger V2 implements a zero-trust, role-based security model. Each user token contains the user's role (`Owner` or `Cashier`).

#### Middleware Pipeline (`auth.js` + `rbac.js`):
1. **`verifyToken`**: Decodes and verifies the Bearer JWT, fetches the user record, and attaches `req.user` to the request context.
2. **`checkRole('Owner')`**: Evaluates `req.user.role`. If the user is not an `Owner`, the request is immediately aborted with HTTP 403 Forbidden:

```javascript
// server/middleware/rbac.js
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Insufficient permissions for this resource'
      });
    }
    next();
  };
};
```

#### Security Boundaries Matrix:

| Resource / Action | Owner Privilege | Cashier Privilege | Enforcement Level |
|---|---|---|---|
| Register Account (Public) | Assigned `Owner` | N/A | Auth Controller |
| Provision Staff (`/register-cashier`) | Allowed | Blocked (HTTP 403) | `verifyToken` + `checkRole('Owner')` |
| View Financial Stats (`/dashboard/stats`) | Allowed | Blocked (HTTP 403) | `verifyToken` + `checkRole('Owner')` |
| View Cashier Stats (`/cashier-stats`) | Allowed | Allowed | `verifyToken` |
| Manage Expenses (`/expenses` CRUD) | Allowed | Blocked (HTTP 403) | `verifyToken` + `checkRole('Owner')` |
| Delete Customer / Product | Allowed | Blocked (HTTP 403) | `verifyToken` + `checkRole('Owner')` |
| Record Inventory & Service Sales | Allowed | Allowed | `verifyToken` |
| Record Customer Payments | Allowed | Allowed | `verifyToken` |

---

### 3.3 Service Sales Architecture

In traditional POS systems, every sale is strictly bound to inventory items. Real-world retail and repair businesses frequently bill for non-inventory services (e.g., labor charges, electronics repair, alterations, delivery fees).

#### Implementation Details:
- The `Transaction` schema includes `isInventorySale: { type: Boolean, default: true }` and `profitAmount: { type: Number }`.
- When `isInventorySale === false`:
  - Physical inventory stock verification and decrement are completely bypassed.
  - Cost of Goods Sold (COGS) is zero; consequently, `profitAmount` equals `totalAmount` (100% gross profit margin).
  - The customer's credit balance is updated with the service charge.
- In the frontend `Add Sale` modal, a dynamic toggle switch switches between:
  - **Inventory Sale**: Standard product selection dropdown, dynamic unit price, stock quantity validation, and quantity input.
  - **Service Sale**: Description text area and service fee amount input, with product inventory selectors hidden.

---

### 3.4 MongoDB Aggregation Pipelines

Financial metrics on the Owner dashboard are generated using server-side aggregation pipelines rather than loading raw documents into Node.js memory:

```javascript
// Aggregating Sales and Gross Profit over dynamic date range
const salesAgg = await Transaction.aggregate([
  {
    $match: {
      userId: targetUserId,
      type: 'SALE',
      date: { $gte: startDate, $lte: endDate }
    }
  },
  {
    $group: {
      _id: null,
      totalSales: { $sum: '$amount' },
      grossProfit: { $sum: '$profitAmount' }
    }
  }
]);

// Aggregating Active Overhead Expenses
const expenseAgg = await Expense.aggregate([
  {
    $match: {
      userId: targetUserId,
      isActive: true,
      date: { $gte: startDate, $lte: endDate }
    }
  },
  {
    $group: {
      _id: null,
      totalExpenses: { $sum: '$amount' }
    }
  }
]);

// Net Income computation:
const netIncome = grossProfit - totalExpenses;
```

#### Historical 30-Day Trend Pipeline:
To power the Recharts visual line graph on the Owner dashboard, a 30-day aggregation groups transactions by calendar day (`$dateToString: { format: "%Y-%m-%d", date: "$date" }`), providing chronological arrays for gross profit and revenue trends without client-side calculation overhead.

---

## 4. Database Schema Specification

### 4.1 Users Collection
```json
{
  "_id": "ObjectId",
  "name": "String (required)",
  "email": "String (unique, required, indexed)",
  "password": "String (bcrypt hashed, min 6 chars)",
  "role": "String (enum: ['Owner', 'Cashier'], default: 'Cashier')",
  "shopName": "String (required)",
  "ownerId": "ObjectId (ref: 'User', null for Owners)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 4.2 Expenses Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: 'User', indexed)",
  "category": "String (enum: ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Maintenance', 'Marketing', 'Other'])",
  "amount": "Number (required, min: 0.01)",
  "date": "Date (default: Date.now, indexed)",
  "notes": "String",
  "isActive": "Boolean (default: true, indexed)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### 4.3 Transactions Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: 'User', indexed)",
  "customerId": "ObjectId (ref: 'Customer', required, indexed)",
  "type": "String (enum: ['SALE', 'PAYMENT'], required)",
  "amount": "Number (required, min: 0.01)",
  "isInventorySale": "Boolean (default: true)",
  "profitAmount": "Number (default: 0)",
  "items": [
    {
      "productId": "ObjectId (ref: 'Product')",
      "name": "String",
      "quantity": "Number (min: 1)",
      "price": "Number",
      "costPrice": "Number"
    }
  ],
  "balanceAfter": "Number (required)",
  "date": "Date (default: Date.now, indexed)",
  "notes": "String",
  "createdAt": "Date"
}
```

---

## 5. RESTful API Endpoint Directory

| Method | Endpoint | Access Role | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new Shop Owner account |
| `POST` | `/api/auth/login` | Public | Authenticate user & return JWT with `role` |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile |
| `POST` | `/api/auth/register-cashier` | Owner Only | Create Cashier account linked to shop |
| `GET` | `/api/auth/cashiers` | Owner Only | List active cashiers for shop |
| `GET` | `/api/dashboard/stats` | Owner Only | Financial intelligence (Net Income, Gross Profit, Sales, Expenses) |
| `GET` | `/api/dashboard/cashier-stats` | Authenticated | Operational metrics (Receivables, Low Stock items, Top Debtors) |
| `GET` | `/api/expenses` | Owner Only | Retrieve overhead expenses with category filtering |
| `POST` | `/api/expenses` | Owner Only | Record overhead business expense |
| `DELETE` | `/api/expenses/:id` | Owner Only | Soft delete expense (`isActive: false`) |
| `GET` | `/api/products` | Authenticated | Retrieve inventory catalog |
| `POST` | `/api/products` | Authenticated | Create product item |
| `PUT` | `/api/products/:id` | Authenticated | Update product attributes |
| `DELETE` | `/api/products/:id` | Owner Only | Soft delete product |
| `GET` | `/api/customers` | Authenticated | List customers with outstanding balances |
| `POST` | `/api/customers` | Authenticated | Register customer khata account |
| `DELETE` | `/api/customers/:id` | Owner Only | Soft delete customer |
| `POST` | `/api/transactions/sale` | Authenticated | Record sale (ACID transaction with inventory toggle) |
| `POST` | `/api/transactions/payment` | Authenticated | Record customer debt repayment |
| `GET` | `/api/transactions/customer/:id` | Authenticated | Retrieve customer ledger statement |
| `GET` | `/api/health` | Public | Uptime health check probe |

---

## 6. Frontend Architecture & Design System

The frontend is constructed with React 19 and Vite 8, utilizing Tailwind CSS 4 along with a custom design system token hierarchy:

- **Typography**:
  - Headings & Numbers: `Fraunces` serif font for a premium, digital ledger aesthetic.
  - UI Labels & Data tables: `Plus Jakarta Sans` for high legibility on mobile and desktop viewports.
- **Color Architecture**:
  - Primary Brand: Deep Forest Emerald (`#0B6B5D` / `#12957F`).
  - Warm Gold accents: `#C9A24B` for financial metrics and profit highlights.
  - Surface Tones: Warm natural parchment (`#F4F2EC` light mode, `#0A1311` dark mode).
  - Status Indicators: Semantic greens (`#12805B`), amber warnings (`#A8700F`), and danger reds (`#C93C3C`).
- **Strict Iconography Standard**:
  - Consistent Lucide icon set across all buttons, navigation pills, and notification toasts.
  - Zero emoji usage across codebase and interface to ensure a professional enterprise presentation.
- **Axios Interceptor**:
  - Centralized error interception catches HTTP 403 Forbidden responses across any API interaction and triggers an immediate "Access Denied: You do not have permission to perform this action" toast notification.

---

## 7. Testing, Security & Verification

### 7.1 Automated Integration Test Suites

The repository contains automated end-to-end integration test suites in `server/scripts/`:

1. `testWeek1Endpoints.js`: Validates Service Sales logic, zero stock deduction, and soft-delete expense CRUD operations.
2. `testWeek2Day1.js`: Verifies `verifyToken` and `checkRole('Owner')` RBAC middleware pipeline on protected routes.
3. `testWeek2Day2.js`: Validates cashier registration and verifies `role` in login responses.
4. `testWeek2Day3_4.js`: Tests aggregation pipelines across date ranges and verifies Net Income computation.
5. `testWeek2Day5.js`: Validates Cashier dashboard stats endpoint to ensure complete exclusion of financial profit and expense data.
6. `testWeek3Day5.js`: Runs full end-to-end integration testing simulating complete Owner and Cashier workflows.

### 7.2 Security Hardening

- **Data Validation**: `express-validator` validates incoming payloads at route entry points. Negative or zero values for expense amounts and service sale fees are rejected with descriptive HTTP 400 responses.
- **NoSQL Injection Defense**: `express-mongo-sanitize` sanitizes request bodies, parameters, and query strings to neutralize prohibited operators (e.g., `$gt`, `$ne`).
- **HTTP Security Headers**: `helmet` configures secure HTTP response headers including Content-Security-Policy and X-Frame-Options.
- **CORS Configuration**: Restricts API calls to approved origins (`CLIENT_URL` supporting comma-separated production origins and Vercel preview domains).

---

## 8. Deployment & Continuous Availability

- **Backend Hosting**: Render Web Service running Node.js (`render.yaml` blueprint with automated `/api/health` probing).
- **Frontend Hosting**: Vercel Edge Network (`client/vercel.json` SPA rewrite rules).
- **Database**: MongoDB Atlas 3-node replica set.
- **Keep-Alive Heartbeat**: Render free tier instances spin down after 15 minutes of inactivity. To ensure zero-latency evaluation and demo readiness, an automated keep-alive service (`server/scripts/uptimePing.js` and `.github/workflows/keepalive.yml`) pings `/api/health` on a 10-minute cadence.

---

## 9. Conclusion

ShopLedger V2 successfully bridges operational retail bookkeeping and administrative financial intelligence. By combining multi-document ACID transactions with role-based access control, real-time aggregation analytics, and resilient cloud deployment, ShopLedger V2 provides a robust, enterprise-grade khata and inventory platform ready for production deployment.
