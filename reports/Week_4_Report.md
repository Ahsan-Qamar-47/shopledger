# Project Progress Report - Week 4

**Course:** ST-315-L Project-I  
**Project Name:** ShopLedger (Khata & Inventory Management System)  
**Reporting Period:** Week 4

## 1. Objectives for the Week
- Finalize the core application flows and conduct end-to-end testing.
- Implement value-added features: PDF Reports and WhatsApp integration.
- Polish the User Interface (empty states, loading spinners, error handling).
- Deploy the frontend and backend to production servers.

## 2. Tasks Accomplished
- **Advanced Features:**
  - Implemented downloadable PDF statement generation using standard web APIs, allowing shop owners to print or share detailed ledgers.
  - Added one-click WhatsApp payment reminders utilizing `whatsapp://` URL intents to facilitate easy communication with debtors.
- **UI & UX Polish:**
  - Added empty state illustrations for lists and optimized search performance.
  - Hardened frontend form validations and implemented proper session expiry handling (auto-logout on 401).
- **Testing & Bug Fixes:**
  - Resolved various mobile UI bugs (e.g., using `dvh` to prevent overlapping when mobile keyboards appear).
  - Verified functional requirements and end-to-end flows (Registration -> Add Product -> Add Customer -> Make Sale -> Make Payment).
- **Deployment:**
  - Configured deployment workflows and successfully deployed the frontend application to Vercel and the backend to Vercel/Render.

## 3. Challenges Faced
- Vercel's Serverless environment posed some initial deployment challenges for the Express backend, requiring architectural adjustments (e.g., using `vercel.json` for rewrites).
- Generating robust PDFs directly from the frontend while ensuring the layout remained consistent across different browsers.

## 4. Project Conclusion
- The MVP for ShopLedger is complete and live. It successfully bridges the gap between traditional paper ledgers and digital systems, providing a modern, fast, and accessible tool for small business owners.
- **Future Scope:** Support for multiple staff accounts, a public customer portal for viewing live balances, and utilizing the official WhatsApp Business API for automated notifications.
