# Library Management System - Complete Setup Guide

This guide provides end-to-end instructions for installing, configuring, and running the Library Management System locally on Windows.

---

## 1. System Prerequisites

Ensure the following tools are installed on your machine:
1. **Node.js**: Version 18.x, 20.x, or 22.x ([Download Node.js](https://nodejs.org/))
   - Verify in terminal:
     ```bash
     node -v
     npm -v
     ```
2. **PostgreSQL & pgAdmin 4**: ([Download PostgreSQL](https://www.postgresql.org/download/windows/))
   - Default port: `5432`
   - Default superuser: `postgres`

---

## 2. Database Setup (PostgreSQL & pgAdmin)

### Step 2.1: Open pgAdmin 4
1. Launch **pgAdmin 4** from your Start Menu.
2. Enter your master password to unlock pgAdmin.
3. In the left panel, expand **Servers** and enter the password for your PostgreSQL server.

### Step 2.2: Create Database `library_management_db`
1. Right-click on **Databases** $\rightarrow$ **Create** $\rightarrow$ **Database...**.
2. Set Database name to:
   ```text
   library_management_db
   ```
3. Click **Save**.

### Step 2.3: Execute Schema Script
1. Left-click on `library_management_db` to select it.
2. Open the **Query Tool** (Tools menu $\rightarrow$ Query Tool, or lightning bolt icon).
3. Open or copy the contents of:
   `library-management-system/database/schema.sql`
4. Press **F5** (or click the Play ▶ icon).
5. Verify success message in the Messages tab (`CREATE TABLE`, `CREATE INDEX`, `CREATE TRIGGER`).

### Step 2.4: Execute Seed Data Script
1. In the Query Tool (or a new query tab), copy the contents of:
   `library-management-system/database/seed.sql`
2. Press **F5**.
3. Verify that 1 admin user, 10 books, 5 members, and 3 loans were inserted.

---

## 3. Backend Configuration & Startup

### Step 3.1: Configure Environment Variables
1. Navigate to `library-management-system/backend/`.
2. Check if a `.env` file exists. If not, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `backend/.env` and update with your actual PostgreSQL credentials:
   ```ini
   PORT=5000
   NODE_ENV=development

   # PostgreSQL Settings
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=library_management_db
   DB_USER=postgres
   DB_PASSWORD=YOUR_ACTUAL_POSTGRES_PASSWORD

   # JWT Auth
   JWT_SECRET=supersecret_jwt_key_library_qa_2026
   JWT_EXPIRES_IN=24h

   # CORS Allowed Origin
   CLIENT_URL=http://localhost:3000
   ```

### Step 3.2: Install Backend Dependencies
In terminal:
```bash
cd "c:\Users\monis\New Project\library-management-system\backend"
npm install
```

### Step 3.3: Start the Backend Server
```bash
npm run dev
```
*Expected console output:*
```text
----------------------------------------------------
[Database Connected]: Successfully connected to 'library_management_db'
[Database Timestamp]: 2026-...
----------------------------------------------------
[Server Status]: Backend server is running on http://localhost:5000
[Health Check]: http://localhost:5000/api/health
[Allowed CORS Origin]: http://localhost:3000
----------------------------------------------------
```

---

## 4. Frontend Configuration & Startup

### Step 4.1: Configure Environment Variables
In `library-management-system/frontend/.env`:
```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

### Step 4.2: Install Frontend Dependencies
Open a **new terminal tab/window**:
```bash
cd "c:\Users\monis\New Project\library-management-system\frontend"
npm install
```

### Step 4.3: Start the Frontend Application
```bash
npm start
```
*The React application will run at:*
```text
http://localhost:3000
```

---

## 5. Logging In to the System

1. Open your browser and navigate to: `http://localhost:3000`
2. Use the default seeded Administrator credentials:
   - **Email**: `admin@library.com`
   - **Password**: `admin123`
3. Click **Sign In**.
4. You will be redirected to the **Dashboard Overview**.

---

## 6. Troubleshooting Common Issues

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL service is stopped | Start PostgreSQL service via Windows Services (`services.msc`). |
| `password authentication failed for user "postgres"` | Incorrect password in `backend/.env` | Update `DB_PASSWORD` in `backend/.env` with your actual password. |
| `Port 5000 already in use` | Another process is occupying port 5000 | Change `PORT=5001` in `backend/.env` and update `frontend/.env` accordingly. |
| `Network or server error` on UI | Backend server is not running | Ensure `npm run dev` is active in the `backend/` folder. |
