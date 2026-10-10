# ShopLedger - Final Lab Report
**Course:** ST-315-L Project-I  
**Project:** ShopLedger (Khata & Inventory Management System)  

## 1. Project Overview
ShopLedger is a modern, responsive web application designed for small business owners in Pakistan to manage their *Khata* (credit ledgers) and inventory efficiently. It bridges the gap between traditional paper-based ledger books and complex, expensive ERP systems by providing an intuitive, mobile-friendly interface for tracking daily sales, customer balances, and low-stock alerts.

## 2. Requirements & Features
### Core Features (MVP)
- **User Authentication:** Secure JWT-based registration and login with session expiry handling.
- **Dashboard:** At-a-glance metrics showing total receivables (Udhaar), today's sales, low stock alerts, and top debtors.
- **Inventory Management:** Full CRUD operations for products, SKU tracking, pricing, and dynamic low-stock threshold monitoring.
- **Customer (Khata) Management:** Track customer details, aggregate balances, and complete transaction histories.
- **Transactions:** Safely record Sales (deducts stock, increases receivables) and Payments (decreases receivables).
- **Reporting:** Generate and download PDF statements for individual customers.
- **Communication:** One-click WhatsApp integration to send outstanding balance reminders.

## 3. System Architecture
ShopLedger follows a standard **MERN (MongoDB, Express.js, React, Node.js)** stack architecture.
- **Frontend (Client):** React.js initialized with Vite, styled with Tailwind CSS. State is managed via React Context (Auth) and local state. Requests are routed via Axios interceptors.
- **Backend (Server):** Node.js and Express.js RESTful API.
- **Database:** MongoDB (hosted on MongoDB Atlas), interfaced using Mongoose ODM.
- **Deployment:** Vercel serverless architecture for both frontend and backend.

*(Insert System Architecture Diagram Here)*

## 4. Screenshots
*(Students: Please insert actual screenshots of your deployed app here before submitting!)*
- **Dashboard:** `![Dashboard Screenshot](path/to/image.png)`
- **Inventory/Khata List:** `![Khata Screenshot](path/to/image.png)`
- **Customer Statement/PDF:** `![Statement Screenshot](path/to/image.png)`

## 5. Database Schema (ERD Overview)
- **User:** `_id`, `name`, `email`, `passwordHash`, `shopName`
- **Customer:** `_id`, `userId` (Ref), `name`, `phone`, `address`, `totalBalance`, `isActive`
- **Product:** `_id`, `userId` (Ref), `name`, `sku`, `price`, `costPrice`, `stockQuantity`, `lowStockThreshold`, `isActive`
- **Transaction:** `_id`, `userId` (Ref), `customerId` (Ref), `type` (SALE | PAYMENT), `amount`, `items` (Array), `balanceAfter`, `date`, `notes`

## 5. API Design Overview
The API is strictly RESTful and secured via a `protect` middleware verifying Bearer JWTs. All queries are scoped by `userId` to ensure strict tenant data isolation.
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard/stats`
- `GET|POST /api/products`, `PUT|DELETE /api/products/:id`
- `GET|POST /api/customers`, `PUT|DELETE /api/customers/:id`
- `POST /api/transactions/sale`, `POST /api/transactions/payment`, `GET /api/transactions/customer/:id`

## 6. Testing Results & Security
- **Data Validation:** `express-validator` strictly enforces data types (no negative prices, no empty strings).
- **Injection Prevention:** `express-mongo-sanitize` strips prohibited characters (like `$gt`) from payloads.
- **Concurrency Testing:** Backend utilizes atomic Mongoose queries (`$inc` and `$gte`) to prevent stock from dropping below zero during simultaneous checkout requests.
- **UI Responsiveness:** Thoroughly tested on mobile viewports (360px+). Use of Dynamic Viewport Height (`dvh`) prevents overlapping UI when mobile keyboards appear.

## 7. Known Limitations
- Vercel Serverless environment means background scheduled tasks (cron jobs) are limited without external services like GitHub Actions (which we successfully set up for backups).
- Application does not yet support multiple staff accounts under a single shop.

## 8. Future Scope
- **Multi-tenant / Staff Accounts:** Allow owners to create restricted accounts for employees/cashiers.
- **Customer Portal:** A public view link where customers can securely view their live khata balance without logging in.
- **Custom Sales/Discounts:** Add line-item discounts and custom tax rates to the checkout flow.
- **WhatsApp Business API:** Upgrade from client-side `whatsapp://` intents to automated server-side message dispatching using Meta's official API.
