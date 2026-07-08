# GMS CRM - Local Development Setup Guide

This guide explains how to set up and run the GMS CRM application on your local machine for development purposes. **This setup runs entirely without Docker and will not affect the production environment.**

---

## 1. Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB Community Server](https://www.mongodb.com/try/download/community)
- [Redis](https://redis.io/download) (or Memurai for Windows)

---

## 2. Environment Setup

The application uses environment-specific configuration files. Do **not** modify `docker-compose.yml`.

1. Go to the `backend/` directory.
2. A `.env.development` file has been pre-configured for you. It points to `localhost` databases.
3. If you need to customize variables, copy `.env.example` to `.env.development`.

**`.env.development` (default values):**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/gms_crm
REDIS_URL=redis://127.0.0.1:6379
JWT_SECRET=GMS_SuperSecret_2026_CRM_Key!
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
```

---

## 3. Database & Cache Verification

Before starting the backend, ensure your local databases are running and accessible.

### Verify MongoDB
Open your terminal and run:
```bash
mongosh
```
If it connects, your MongoDB is running locally. You can exit by typing `exit`.

### Verify Redis
Open your terminal and run:
```bash
redis-cli ping
```
**Expected Output:**
```
PONG
```

---

## 4. Starting the Backend

1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   **Expected Output:**
   ```
   [Config] Loading environment from .env.development
   ✅ MongoDB Connected: 127.0.0.1
   ✅ Redis Connected (Cache Service)
   ✅ Server running in development mode on port 5000
   ```

---

## 5. Starting the Frontend

1. Open a new terminal window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the frontend in your browser at `http://localhost:5173`.

---

## 6. Common Troubleshooting

- **`ENOTFOUND gms-redis` or `gms-mongo` errors:**
  This means your backend is somehow picking up production Docker variables. Ensure you are running `npm run dev` (which explicitly sets `NODE_ENV=development`) and that your `.env.development` file contains `127.0.0.1` instead of `gms-redis`/`gms-mongo`.

- **MongoDB connection FAILED / `ECONNREFUSED`:**
  Ensure the MongoDB background service is actually running on your machine. On Windows, check the "Services" app for `MongoDB Server`. On macOS/Linux, try `brew services start mongodb-community` or `sudo systemctl start mongod`.

- **Redis Error: `connect ECONNREFUSED 127.0.0.1:6379`:**
  Ensure the Redis server is running. On Windows, you might need to use WSL, Memurai, or a Redis Windows port. On macOS/Linux, run `redis-server`.

---

## 7. Production Note
The `docker-compose.yml` and `.env.production` files handle the deployment to AWS EC2. **Do not run `docker-compose up` on your local machine unless you are testing the production build**, as it may attempt to bind to ports you are already using.
