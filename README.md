# ShopLedger V2

ShopLedger V2 is an enterprise digital khata, inventory, and profit intelligence platform designed for small-to-medium retail and service shops. Built on the MERN stack (MongoDB Atlas, Express 5, React 19, Node.js), it combines operational floor sales with executive financial intelligence.

---

## Key Highlights in Version 2

- **Multi-Document ACID Transactions**: Uses MongoDB sessions (`mongoose.startSession()`) to ensure atomic, rollback-safe transactions across inventory stock, customer balances, and immutable transaction ledgers.
- **Role-Based Access Control (RBAC)**: Enforces strict separation between `Owner` (full financial analytics, expenses, staff provisioning) and `Cashier` (isolated operational floor terminal, blocked from financial data and cost prices).
- **Service Sales Flow**: Toggle between physical inventory items (with atomic stock deduction) and service fees (e.g. repairs, alterations, delivery) recorded with zero stock decrement and 100% gross profit.
- **Overhead Expense Management**: Track recurring expenses (Rent, Utilities, Salaries, Supplies) with soft-delete capabilities and automatic deduction from gross profit.
- **Financial Intelligence Dashboard**: Real-time KPI metric cards (Net Income, Gross Profit, Total Sales, Total Expenses), dynamic date range filtering (Today, This Week, This Month), and 30-day historical trend graphs powered by Recharts.
- **Zero Cold-Start Uptime Monitor**: Heartbeat ping monitor and GitHub Actions keep-alive workflow to prevent Render free-tier cold-start delays during presentations and grading.
- **Zero-Emoji Architecture**: Polished design system built with Plus Jakarta Sans, Fraunces serif typography, and Lucide vector iconography.

---

## Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS 4, Recharts, Lucide React, Axios, React Hot Toast, jsPDF
- **Backend**: Node.js, Express 5, Mongoose 9, JWT Authentication, Helmet, Express-Mongo-Sanitize, Express-Validator
- **Database**: MongoDB Atlas 3-Node Replica Set (enables multi-document transactions)
- **Deployment**: Render Web Service (Backend) and Vercel Edge Network (Frontend)
- **Monitoring & CI/CD**: GitHub Actions (Keep-Alive Cron, Automated Daily Backups)

---

## Live Deployment & Demo Credentials

- **Frontend Application**: Deployed on Vercel
- **Backend API**: Deployed on Render (`/api/health`)
- **Owner Demo Account**: `owner@demo.com` / `Password123!` (Full financial intelligence, expenses, cashier management)
- **Cashier Demo Account**: `cashier@demo.com` / `Password123!` (Operational floor terminal, receivables, alerts)

---

## Local Setup & Quickstart

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas Replica Set connection URI (required for ACID sessions) or local replica set

### 1. Clone the repository
```bash
git clone https://github.com/Ahsan-Qamar-47/shopledger.git
cd shopledger
git checkout v2
```

### 2. Backend Setup
```bash
cd server
npm install
```
Configure your `server/.env` file:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/shopledger?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=30d
CLIENT_URL=http://localhost:5173
```
Run the seed script to populate sample products, customers, and transactions:
```bash
npm run seed
```
Start the backend development server:
```bash
npm run dev
```

### 3. Frontend Setup
In a new terminal window:
```bash
cd client
npm install
```
Configure your `client/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```
Start the frontend development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Automated Test Suites

ShopLedger V2 includes automated test scripts validating all deliverables:

```bash
# Run Week 1: Service Sales & Expense CRUD tests
npm --prefix server run test:week1

# Run Week 2 Day 1: RBAC Middleware pipeline tests
npm --prefix server run test:week2day1

# Run Week 2 Day 2: Cashier Registration & JWT Role payload tests
npm --prefix server run test:week2day2

# Run Week 2 Day 3-4: Aggregation pipelines & Net Income tests
npm --prefix server run test:week2day3-4

# Run Week 2 Day 5: Cashier Dashboard stats isolation tests
npm --prefix server run test:week2day5

# Run Week 3 Day 5: Full Owner & Cashier end-to-end integration tests
npm --prefix server run test:week3day5
```

---

## Documentation Links

- **Technical Lab Project Report**: Refer to `V2_PROJECT_REPORT.md` (or `REPORT.md`) for detailed architecture diagrams, ACID implementation details, and RBAC matrix.
- **3-5 Minute Video Demo Script**: Refer to `DEMO_SCRIPT.md` for the scene-by-scene demonstration walkthrough.
- **Production Deployment Guide**: Refer to `DEPLOYMENT.md` for step-by-step setup on Render and Vercel.
