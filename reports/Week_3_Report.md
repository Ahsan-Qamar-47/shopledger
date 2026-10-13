# Project Progress Report - Week 3

**Course:** ST-315-L Project-I  
**Project Name:** ShopLedger (Khata & Inventory Management System)  
**Reporting Period:** Week 3

## 1. Objectives for the Week
- Scaffold the frontend application using React and Vite.
- Implement responsive, mobile-first styling using Tailwind CSS.
- Establish global state management for user authentication.
- Build the main application UI (Dashboard, Customer list, Inventory list).

## 2. Tasks Accomplished
- **Frontend Setup:** Initialized the React application with Vite for fast builds and hot-module replacement. Configured Tailwind CSS for utility-first styling.
- **Authentication Flow:** Built secure Login and Registration pages, implemented a React Context for Auth, and created protected routes. Requests are now routed via Axios with JWT interceptors.
- **Layout & Routing:** Implemented a mobile-first application layout featuring a responsive sidebar/bottom navigation.
- **CRUD Interfaces:** Built the user interfaces for managing Customers and Inventory, integrating them seamlessly with the backend REST APIs.
- **Dashboard API & UI:** Added a dashboard stats API to aggregate total receivables, today's sales, and low stock alerts, and visualized this data on the frontend dashboard.
- **Transaction Modals:** Developed complex modals for the Sale and Payment flows, allowing users to select customers and add products to a cart dynamically.

## 3. Challenges Faced
- Ensuring the UI remains responsive and accessible across various device sizes, particularly optimizing for mobile viewports (360px+) commonly used by small shop owners.
- Managing complex local state when building the dynamic cart in the Sale modal.

## 4. Plan for Next Week
- Add advanced features: PDF statement generation and WhatsApp reminders.
- Polish the UI, add loading states, and handle edge cases (like empty states).
- Fix deployment bugs and deploy the application live.
