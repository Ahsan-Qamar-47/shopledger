# ShopLedger V2 - Video Demonstration Script

**Target Duration**: 3 to 5 minutes  
**Target Audience**: Course Evaluator / Technical Reviewer  
**Scope**: ShopLedger V2 (RBAC, Financial Analytics, Service Sales & ACID Transactions)  

---

## Pre-Recording Checklist

1. **Verify Backend Activity**:
   Ensure backend instance is awake by running `npm --prefix server run ping -- --once` or visiting `/api/health`.
2. **Demo Credentials**:
   - **Owner Account**: `owner@demo.com` / `Password123!`
   - **Cashier Account**: `cashier@demo.com` / `Password123!`
3. **Display Settings**:
   Set screen resolution to 1080p (1920x1080) with 100% or 110% browser zoom for optimal legibility.
4. **Recording Tool**:
   OBS Studio, Loom, or ScreenRec with clear microphone audio.

---

## Scene 1: Introduction (0:00 - 0:40)

- **Visual**: Show the ShopLedger V2 Login screen with the clean digital khata aesthetic.
- **Voiceover**:  
  "Hello, this is my final project demonstration for ShopLedger V2, an enterprise-grade digital khata, inventory, and profit management system developed for ST-315-L Project-I.  
  In Version 2, we have upgraded the architecture from a simple ledger to a multi-role, business-intelligence platform featuring multi-document ACID transactions, role-based access control between Shop Owners and Cashiers, an overhead expense management system, service sales without inventory deductions, and real-time financial aggregation pipelines."

---

## Scene 2: Owner Financial Intelligence Dashboard (0:40 - 1:30)

- **Visual**: Log in using the Owner credentials (`owner@demo.com`). The Owner Dashboard appears.
- **Action**: Hover across the 4 primary KPI cards at the top.
- **Voiceover**:  
  "Logging in as the Shop Owner brings us to the Financial Intelligence Dashboard. Unlike traditional ledgers that only track cash flow, ShopLedger V2 provides four executive KPI metrics calculated in real-time via MongoDB aggregation pipelines:  
  Net Income, Gross Profit, Total Sales, and Overhead Expenses."
- **Action**: Click the date range filter buttons: **Today**, **This Week**, and **This Month**.
- **Voiceover**:  
  "With our dynamic date range filtering, the owner can instantly toggle between Today, This Week, and This Month. When clicked, query parameters are dispatched to the backend, recomputing all four KPI metrics on the fly."
- **Action**: Scroll to the Recharts interactive graph.
- **Voiceover**:  
  "Below the metric cards, an interactive Recharts line chart plots the 30-day gross profit and revenue trends, giving the shop owner immediate visibility into performance trajectory."

---

## Scene 3: Cashier Staff Provisioning (1:30 - 2:10)

- **Visual**: Click on the **Cashiers** navigation link in the top bar.
- **Voiceover**:  
  "To prevent shop floor staff from viewing confidential profit margins or cost prices, ShopLedger V2 implements strict Role-Based Access Control.  
  As an Owner, I have access to the Cashier Staff Provisioning portal."
- **Action**: Fill in the registration form: Name: `Ali Cashier`, Email: `ali@demo.com`, Password: `Password123!`. Click **Register Cashier**.
- **Voiceover**:  
  "Submitting this form dispatches a POST request to `/api/auth/register-cashier`, which is protected by our `verifyToken` and `checkRole('Owner')` middleware pipeline. The cashier account is provisioned and linked to this shop."

---

## Scene 4: Cashier Terminal & Security Isolation (2:10 - 2:50)

- **Visual**: Click **Logout**. Enter the Cashier credentials (`ali@demo.com` / `Password123!`).
- **Voiceover**:  
  "Now, let us switch perspectives and log in as the Cashier."
- **Action**: Point to the navigation bar and the Cashier dashboard.
- **Voiceover**:  
  "Notice two fundamental security boundaries immediately:  
  First, in the navigation bar, the Expenses and Cashiers tabs are completely hidden from the DOM.  
  Second, the Cashier Dashboard has been stripped of all financial intelligence. The cashier cannot see Net Income, Gross Profit, or business expenses. Instead, they are presented with an operational floor view: Total Receivables, Low Stock Alerts, and Top Debtors."
- **Action**: Manually navigate to `/expenses` or explain the Axios interceptor.
- **Voiceover**:  
  "Furthermore, our centralized Axios interceptor intercepts any unauthorized requests. If a restricted API is hit, the backend returns HTTP 403 Forbidden, and the UI displays an Access Denied security toast."

---

## Scene 5: Upgraded Sales Flow & Service Sale Toggle (2:50 - 3:50)

- **Visual**: Click **Khata (Customers)**. Select an existing customer.
- **Action**: Click **Add Sale**.
- **Voiceover**:  
  "Now let us examine our upgraded sales workflow. When recording a sale, ShopLedger V2 introduces a dynamic toggle switch between Inventory Sales and Service Sales."
- **Action**: Point to the toggle switch set to **Inventory Sale**.
- **Voiceover**:  
  "When Inventory Sale is active, the cashier selects physical products from inventory. Stock availability is verified and deducted atomically using MongoDB ACID transactions."
- **Action**: Flip the toggle switch to **Service Sale**.
- **Voiceover**:  
  "However, if the shop provides labor or services—such as repairs, installations, or tailoring—we flip the toggle to Service Sale.  
  Notice how product selectors immediately disappear and are replaced by Service Description and Service Fee inputs."
- **Action**: Enter Description: `Mobile Screen Replacement Service`, Amount: `1500`. Click **Save Sale**.
- **Voiceover**:  
  "I will record a 1500 rupee service fee. Under the hood, the backend recognizes `isInventorySale: false`. Physical inventory stock is left completely untouched, the customer's balance increments by 1500, and the entire 1500 is booked as pure profit."
- **Action**: Show the updated ledger entry in the customer statement table.

---

## Scene 6: Overhead Expenses & Live Profit Recalculation (3:50 - 4:30)

- **Visual**: Log out and log back in as Owner (`owner@demo.com`).
- **Action**: Navigate to the **Expenses** page.
- **Voiceover**:  
  "Returning to the Owner account, let us demonstrate how expenses feed into real-time business intelligence. I will navigate to the Expenses tab."
- **Action**: Click **+ Add Expense**. Select Category: `Rent`, Amount: `5000`, Date: Today, Notes: `Monthly Shop Rent`. Click **Save Expense**.
- **Voiceover**:  
  "Here we record a 5,000 rupee rent expense. The backend enforces positive numerical validation through express-validator and stores it with soft-delete support."
- **Action**: Navigate back to **Dashboard**.
- **Voiceover**:  
  "Returning to the Owner Dashboard, look at the KPI cards: Total Expenses has immediately increased by 5,000 rupees, and Net Income has automatically updated: Net Income equals Gross Profit minus Total Expenses. The entire calculation is performed server-side with zero discrepancy."

---

## Scene 7: Conclusion & Architecture Wrap-Up (4:30 - 5:00)

- **Visual**: Show the full dashboard view or README/architecture summary.
- **Voiceover**:  
  "In summary, ShopLedger V2 delivers:  
  1. Multi-document ACID transactions ensuring absolute ledger integrity.  
  2. Role-Based Access Control isolating floor operations from financial intelligence.  
  3. Seamless Service Sales accounting alongside physical inventory.  
  4. Real-time aggregation intelligence with date filtering and Recharts visualization.  
  5. Full cloud deployment on Render and Vercel backed by an automated keep-alive heartbeat monitor.  
  Thank you for evaluating ShopLedger V2."
