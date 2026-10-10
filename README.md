# ShopLedger

A modern, responsive Khata (credit ledger) and Inventory management system for small businesses, built on the MERN stack.

## 🚀 Live Demo
- **Frontend URL:** [Insert your Vercel Frontend URL here]
- **Backend API:** [Insert your Vercel Backend URL here]
- **Demo Account:** `demo@shopledger.com`
- **Demo Password:** `Password123!`

## 🛠 Tech Stack
- **Frontend:** React.js, Vite, Tailwind CSS, Recharts, jsPDF
- **Backend:** Node.js, Express.js, JWT Authentication
- **Database:** MongoDB (Mongoose)
- **Deployment:** Vercel (Serverless)
- **CI/CD:** GitHub Actions (Automated Daily Database Backups)

## 💻 Local Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas URI

### 1. Clone the repository
```bash
git clone https://github.com/your-username/shopledger.git
cd shopledger
```

### 2. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
```
Run the seed script to populate demo data:
```bash
npm run seed
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd client
npm install
```
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api
```
Start the frontend development server:
```bash
npm run dev
```
The application will be running at `http://localhost:5173`.

## 📜 Documentation
Please refer to `REPORT.md` for the complete Lab Project architectural overview, ERD, API routes, and testing methodology.
