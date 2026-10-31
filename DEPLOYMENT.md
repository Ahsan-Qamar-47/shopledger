# ShopLedger V2 - Deployment Guide

This guide provides step-by-step instructions for deploying the ShopLedger V2 production stack using Render (Backend), Vercel (Frontend), and MongoDB Atlas (Database).

---

## Architecture Overview

- **Backend API**: Node.js & Express 5 deployed on Render Web Service.
- **Frontend SPA**: React 19 & Vite 8 deployed on Vercel Edge Network.
- **Database**: MongoDB Atlas Replica Set (supports ACID multi-document transactions).
- **Keep-Alive Monitor**: Uptime ping heartbeat service to eliminate Render free-tier cold starts.

---

## Part 1: MongoDB Atlas Setup (Prerequisite)

ShopLedger V2 relies on multi-document ACID transactions (`mongoose.startSession()`), which require a MongoDB replica set. MongoDB Atlas free tier (M0) provides a 3-node replica set out of the box.

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create or select a cluster (M0 Free tier is sufficient).
3. Under **Security > Database Access**, create a user with read/write permissions for the `shopledger` database.
4. Under **Security > Network Access**, add IP address `0.0.0.0/0` (Allow Access from Anywhere) to permit connections from Render's dynamic IP ranges.
5. In **Database > Connect**, select **Drivers > Node.js** and copy the connection string:
   ```env
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/shopledger?retryWrites=true&w=majority
   ```

---

## Part 2: Backend Deployment on Render

### Method A: Blueprint Deployment (render.yaml)

The repository includes a preconfigured `render.yaml` specification file at the root.

1. Connect your GitHub repository to [Render](https://dashboard.render.com/).
2. Click **New +** and select **Blueprint**.
3. Select the `shopledger` repository and target branch `v2`.
4. Render automatically detects `render.yaml` and sets:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `node server.js`
   - Health check path: `/api/health`
5. Supply the required environment variables when prompted:
   - `MONGO_URI`: Your MongoDB Atlas connection URI.
   - `JWT_SECRET`: A secure random 64-character secret string.
   - `CLIENT_URL`: Comma-separated allowed frontend origins (e.g., `https://shopledger.vercel.app,http://localhost:5173`).
6. Click **Apply**. Render will build and deploy the web service.

### Method B: Manual Web Service Setup

If configuring manually via the Render dashboard:
1. Click **New + > Web Service**.
2. Select repository and set:
   - **Name**: `shopledger-api`
   - **Region**: Closest to your users (e.g., Oregon, Frankfurt, Singapore).
   - **Branch**: `v2`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free
3. Under **Advanced Settings**:
   - **Health Check Path**: `/api/health`
4. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: `mongodb+srv://<username>:<password>@cluster.mongodb.net/shopledger?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<your_secure_secret>`
   - `JWT_EXPIRE`: `30d`
   - `CLIENT_URL`: `https://your-frontend.vercel.app`
5. Click **Create Web Service**. Note your backend public URL (e.g., `https://shopledger-api.onrender.com`).

---

## Part 3: Frontend Deployment on Vercel

1. Log in to [Vercel](https://vercel.com/) and click **Add New > Project**.
2. Import the `shopledger` repository.
3. Configure project settings:
   - **Framework Preset**: Vite
   - **Root Directory**: Click edit and select `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Expand **Environment Variables** and add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://<your-render-app-name>.onrender.com/api`
   *(Ensure there is no trailing slash after `/api`)*
5. Click **Deploy**.
6. Once deployed, note your Vercel URL (e.g., `https://shopledger.vercel.app`).
7. Return to the Render dashboard and update `CLIENT_URL` to include your new Vercel production domain.

---

## Part 4: Preventing Free Tier Cold Starts (Uptime Ping Service)

Render's free tier spins down instances after 15 minutes of inactivity. When a user sends a request to a sleeping server, cold-start latency can take 30 to 60 seconds.

To maintain warm instances for live presentations, grading, and testing, use one of the following keep-alive solutions:

### Option 1: Native Node.js Heartbeat Script

Run the built-in uptime ping tool locally or on a VPS:
```bash
# Ping once to check status:
npm --prefix server run ping -- --url=https://shopledger-api.onrender.com --once

# Keep alive continuously (pings every 10 minutes):
npm --prefix server run ping -- --url=https://shopledger-api.onrender.com --interval=10
```

### Option 2: Automated GitHub Actions Workflow

The repository includes `.github/workflows/keepalive.yml`:
1. In your GitHub repository, navigate to **Settings > Secrets and variables > Actions**.
2. Add a repository secret:
   - Name: `RENDER_BACKEND_URL`
   - Value: `https://<your-render-app-name>.onrender.com`
3. The workflow runs every 10 minutes via cron (`*/10 * * * *`) and can also be triggered manually under the **Actions** tab.

### Option 3: Free Web Monitor (Cron-Job.org / UptimeRobot)

1. Register at [Cron-Job.org](https://cron-job.org/) or [UptimeRobot](https://uptimerobot.com/).
2. Create an HTTP monitor targeting `https://<your-render-app-name>.onrender.com/api/health`.
3. Set the execution interval to every 10 minutes.
4. Expected HTTP response status: `200 OK`.

---

## Part 5: Post-Deployment Verification Checklist

Verify your deployed environment using this checklist:

- [ ] **Health Endpoint**: Visit `https://<your-render-app>.onrender.com/api/health` and verify HTTP 200 with JSON status payload.
- [ ] **Owner Registration**: Navigate to the Vercel app, register a new shop account, and confirm the role is assigned as `Owner`.
- [ ] **Cashier Creation**: Log in as Owner, open the Cashiers management tab, and create a Cashier account (`POST /api/auth/register-cashier`).
- [ ] **RBAC Isolation**: Log in with the Cashier credentials. Verify that the Expenses tab is completely hidden and direct requests to restricted endpoints return HTTP 403 Forbidden.
- [ ] **Service Sale Flow**: Toggle Service Sale in the Add Sale modal, record a transaction without product inventory deduction, and verify pure profit calculation.
- [ ] **Analytics & Date Filtering**: Switch between Today, This Week, and This Month filters on the Owner dashboard and verify chart rendering with Recharts.
- [ ] **Page Refresh**: Reload any internal route (e.g., `/inventory`, `/expenses`) in the browser to confirm Vercel SPA rewrite handles routing without 404 errors.
