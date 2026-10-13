# Project Progress Report - Week 1

**Course:** ST-315-L Project-I  
**Project Name:** ShopLedger (Khata & Inventory Management System)  
**Reporting Period:** Week 1

## 1. Objectives for the Week
- Define project scope and core requirements for the MVP.
- Design the initial database schema (ERD) for Users, Customers, Products, and Transactions.
- Initialize the code repository and setup version control.
- Scaffold the backend application structure using Node.js and Express.js.
- Setup the MongoDB database and connect it to the server.

## 2. Tasks Accomplished
- **Project Initialization:** Created the GitHub repository and initialized a monorepo structure (client and server directories).
- **Database Setup:** Created a MongoDB Atlas cluster and successfully connected the Node.js backend using Mongoose.
- **Backend Scaffold:** Set up the basic Express server with standard middleware (CORS, Express JSON, etc.).
- **Authentication Implementation:** 
  - Designed the `User` schema in Mongoose.
  - Implemented secure backend authentication using JWT (JSON Web Tokens) and `bcrypt` for password hashing.
  - Created `/api/auth/register`, `/api/auth/login`, and `/api/auth/me` endpoints.
  - Implemented a `protect` middleware to secure private routes.

## 3. Challenges Faced
- Understanding the best approach for securing REST APIs with JWT and ensuring strict tenant isolation so one shop owner cannot access another's data.
- Handling environment variables securely for database connection strings and JWT secrets.

## 4. Plan for Next Week
- Implement the core business logic (CRUD operations) for Inventory (Products) and Khata (Customers).
- Design and implement the Transaction schema to handle sales and payments securely.
- Ensure atomic operations are in place to prevent database inconsistencies during concurrent sales.
