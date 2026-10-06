# ShopLedger

ShopLedger is a modern business management and ledger application designed to track sales, expenses, inventory, and financial reports.

## Project Structure

```
shopledger/
├── client/      # Frontend application
└── server/      # Backend API application
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or MongoDB Atlas)

### Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Ahsan-Qamar-47/shopledger.git
   cd shopledger
   ```

2. **Backend Setup:**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Update environment variables in .env as needed
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd client
   # Client setup coming soon
   ```

## API Endpoints

- `GET /api/health` - Check backend service health status
