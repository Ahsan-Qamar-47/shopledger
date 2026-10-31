# Changelog

All notable changes to the **ShopLedger** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-10-31

### Added
- **Multi-Document ACID Transactions**: Atomic inventory decrement and customer balance updates wrapped in MongoDB sessions (`mongoose.startSession()`). Failed transactions rollback automatically to eliminate ghost debits.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `Owner` and `Cashier` roles. Cashiers are restricted from financial statistics, cost prices, and overhead expenses.
- **Service Sales Flow**: Added capability to record labor/service sales (`isInventorySale: false`) that add pure profit without reducing physical inventory stock.
- **Operating Expense Management**: Added complete CRUD API and UI for overhead expenses (Rent, Utilities, Salaries, Supplies) featuring soft delete (`isActive: false`).
- **Financial Intelligence Dashboard**: Real-time aggregation pipeline calculating `Gross Profit`, `Total Sales`, `Operating Expenses`, and `Net Income` (`Gross Profit - Expenses`).
- **Dynamic Date Filtering**: Owner dashboard now supports dynamic timeframe filtering (`Today`, `This Week`, `This Month`) with responsive metric updates.
- **Gross Profit Trend Visualization**: Interactive 30-day historical net income and gross profit area chart built with Recharts.
- **Cashier Management Module**: Dedicated Owner interface to create, monitor, and manage cashier staff accounts (`POST /api/auth/register-cashier`).
- **Zero Cold-Start Keepalive**: Uptime ping monitor and GitHub Actions cron job to prevent Render free-tier instance spindown.
- **Comprehensive Automated Test Suites**: Integration and unit test scripts covering all Week 1 through Week 4 milestones (`test:week1` through `test:week3day5`).

### Changed
- Migrated backend architecture to Express 5 and Mongoose 9.
- Upgraded frontend build system to Vite 8, React 19, and Tailwind CSS 4.
- Redesigned UI adhering to a clean zero-emoji architecture with Lucide vector icons and typography (Plus Jakarta Sans & Fraunces).
- Refactored Axios instance with response interceptor to handle HTTP 403 Forbidden scenarios gracefully.

### Security
- Introduced `rbac.js` authorization middleware with role verification guards.
- Sanitized input queries via `express-mongo-sanitize` to defend against NoSQL injection.
- Added brute-force protection using `express-rate-limit` on authentication endpoints.
- Enforced HTTP security headers via `helmet`.

---

## [1.0.0] - 2026-10-07

### Added
- Initial digital khata (ledger) ledger platform.
- Basic customer management and customer credit statements with PDF export (`jsPDF`).
- Product inventory tracking with basic stock levels.
- Direct sales and payment recording.
- JWT-based user authentication and shop profile creation.
- Responsive dark-mode and light-mode dashboard.
