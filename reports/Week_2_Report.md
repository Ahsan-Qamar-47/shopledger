# Project Progress Report - Week 2

**Course:** ST-315-L Project-I  
**Project Name:** ShopLedger (Khata & Inventory Management System)  
**Reporting Period:** Week 2

## 1. Objectives for the Week
- Develop RESTful APIs for managing Customers (Khata).
- Develop RESTful APIs for managing Products (Inventory).
- Implement the core Transaction engine to handle Sales (deducting inventory, increasing receivable balance) and Payments (decreasing receivable balance).

## 2. Tasks Accomplished
- **Data Models:** Created robust Mongoose schemas for `Customer`, `Product`, and `Transaction`.
- **Customer API:** Implemented full CRUD endpoints (`GET`, `POST`, `PUT`, `DELETE`) for Customers, ensuring each request is scoped to the logged-in `userId`.
- **Product API:** Implemented full CRUD endpoints for Products with fields like SKU, pricing, and stock quantity.
- **Transaction Engine:** 
  - Created an atomic sale endpoint (`/api/transactions/sale`) that calculates totals, deducts stock quantities, and increments the customer's total balance.
  - Implemented payment and statement endpoints with balance verification to securely record cash receipts.
- **Postman Documentation:** Exported and maintained Postman documentation for all backend endpoints.

## 3. Challenges Faced
- Handling atomic updates in MongoDB when processing a sale. We utilized Mongoose atomic operators (`$inc` and `$gte`) to ensure stock does not drop below zero during simultaneous checkout requests.
- Validating nested arrays of items in the transaction payload to ensure data integrity before writing to the database.

## 4. Plan for Next Week
- Scaffold the React frontend and configure routing.
- Implement the authentication context and UI (Login/Register).
- Build the core mobile-first layout and reusable UI components.
- Connect the frontend to the backend APIs.
