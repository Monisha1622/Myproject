# LIBRARY MANAGEMENT SYSTEM – MASTER PROJECT DOCUMENTATION

**Project Name**: Library Management System  
**Purpose**: Practical QA Training Application (Database Testing, API Testing, UI Automation, CI/CD)  
**Architecture**: 3-Tier Client-Server Architecture (React Frontend, Node/Express Backend, PostgreSQL Database)  
**Root Directory**: `c:\Users\monis\New Project\library-management-system`

---

## 1. Executive Summary & Goals

This project is a real-world, full-stack enterprise web application built to serve as a complete testing sandbox for QA Engineers. It allows testers to practice:
1. **Database Testing**: Writing complex queries, validating check constraints, unique constraints, foreign keys, triggers, and ACID transactions using PostgreSQL and pgAdmin.
2. **API Testing**: Manually executing and validating REST API requests with headers, status codes, payload validations, and authentication using Postman.
3. **UI Automation**: Writing reliable, flakiness-free automation scripts using Playwright and JavaScript using stable `data-testid` attributes.
4. **DevOps & CI/CD**: Future integration with Git, GitHub, and automated GitHub Actions workflows.

---

## 2. Technology Stack

| Layer | Technology | Version / Tool | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend** | React.js | 18.3.1 | Single Page Application (SPA) User Interface |
| | JavaScript | ES6+ | UI Logic and state management |
| | CSS3 | Native CSS | Custom responsive design system (no bulky UI libraries) |
| | Axios | 1.7.2 | HTTP client with automatic JWT token injection |
| | Vite | 5.3.4 | Development server & fast production bundler |
| **Backend** | Node.js | 22.x | Server runtime environment |
| | Express.js | 4.19.2 | REST API server framework |
| | pg (node-postgres) | 8.11.5 | PostgreSQL connection pooling and queries |
| | bcryptjs | 2.4.3 | Secure one-way password hashing (10 salt rounds) |
| | jsonwebtoken | 9.0.2 | Signed JWT generation and verification |
| | cors | 2.8.5 | Cross-Origin Resource Sharing handling |
| | dotenv | 16.4.5 | Environment variable configuration |
| **Database** | PostgreSQL | 14+ | Relational Database Management System |
| | pgAdmin 4 | GUI Client | Manual database inspection and testing tool |

---

## 3. System Architecture & Data Flow

```text
┌────────────────────────────────────────────────────────┐
│                   React Frontend                       │
│              (http://localhost:3000)                   │
│                                                        │
│   LoginPage  |  Dashboard  |  Books  | Members | Issues│
└───────────────────────────┬────────────────────────────┘
                            │
               HTTP REST / JSON (Axios)
            Header: Authorization Bearer <token>
                            │
┌───────────────────────────▼────────────────────────────┐
│                Node.js & Express Backend               │
│              (http://localhost:5000)                   │
│                                                        │
│  [Auth Middleware] ──> [Validators] ──> [Controllers]  │
│  [Error Handling Middleware (Translates PG Codes)]     │
└───────────────────────────┬────────────────────────────┘
                            │
               node-postgres (pg.Pool)
             Parameterized SQL Queries &
             ACID Transactions (FOR UPDATE)
                            │
┌───────────────────────────▼────────────────────────────┐
│                  PostgreSQL Database                   │
│               (library_management_db)                  │
│                                                        │
│     users   |   books   |   members   |  book_issues   │
└────────────────────────────────────────────────────────┘
```

---

## 4. Complete Project Directory Structure

```text
library-management-system/
│
├── frontend/                                # React Frontend
│   ├── public/                              # Public static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── Alert.js                     # Global alert message banners
│   │   │   ├── ConfirmationModal.js         # Confirm delete & return modal
│   │   │   ├── Header.js                    # Header bar with user profile & logout
│   │   │   ├── LoadingSpinner.js            # Loading spinner component
│   │   │   ├── Modal.js                     # Base modal popup component
│   │   │   └── Sidebar.js                   # Navigation sidebar
│   │   ├── hooks/
│   │   │   └── useAuth.js                   # AuthContext hook (login, logout, session)
│   │   ├── pages/
│   │   │   ├── BooksPage.js                 # Book management (CRUD, search, filters)
│   │   │   ├── DashboardPage.js             # Real-time statistics cards & activities
│   │   │   ├── IssuesPage.js                # Book loan & return workflows
│   │   │   ├── LoginPage.js                 # Admin authentication page
│   │   │   └── MembersPage.js               # Member directory (CRUD, loans view)
│   │   ├── services/
│   │   │   └── api.js                       # Axios instance with interceptors
│   │   ├── styles/
│   │   │   └── main.css                     # Complete application styling
│   │   ├── App.js                           # App root & navigation router
│   │   └── index.js                         # React DOM mount point
│   ├── .env                                 # VITE_API_BASE_URL
│   ├── .env.example                         # Frontend env template
│   ├── index.html                           # HTML template
│   ├── package.json                         # Frontend dependencies & scripts
│   └── vite.config.js                       # Vite bundler config
│
├── backend/                                 # Node.js & Express REST Backend
│   ├── config/
│   │   └── db.js                            # PostgreSQL pool & query execution
│   ├── controllers/
│   │   ├── authController.js                # Login & /me controller
│   │   ├── bookController.js                # Books CRUD & search controller
│   │   ├── dashboardController.js           # Real-time metric queries
│   │   ├── issueController.js               # Transaction-safe issue & return
│   │   └── memberController.js              # Members CRUD controller
│   ├── middleware/
│   │   ├── authMiddleware.js                # JWT verification & admin guard
│   │   └── errorHandler.js                  # Centralized error & PG code mapping
│   ├── routes/
│   │   ├── authRoutes.js                    # /api/auth
│   │   ├── bookRoutes.js                    # /api/books
│   │   ├── dashboardRoutes.js               # /api/dashboard
│   │   ├── index.js                         # Root API router
│   │   ├── issueRoutes.js                   # /api/issues
│   │   └── memberRoutes.js                  # /api/members
│   ├── utils/
│   │   └── jwt.js                           # Token signing & verification
│   ├── validators/
│   │   ├── authValidator.js                 # Login payload validation
│   │   ├── bookValidator.js                 # Book fields & copy constraints
│   │   ├── issueValidator.js                # Issue date & ID validation
│   │   └── memberValidator.js               # Member email & format validation
│   ├── .env.example                         # Backend env template
│   ├── package.json                         # Backend dependencies & scripts
│   └── server.js                            # Express app entry & health check
│
├── database/                                # Database SQL Scripts
│   ├── schema.sql                           # DDL: Tables, constraints, indexes, triggers
│   ├── seed.sql                             # DML: Default admin, 10 books, 5 members, loans
│   └── queries.sql                          # Comprehensive QA practice queries
│
├── docs/                                    # Project Documentation
│   ├── api-documentation.md                 # Full REST API specifications
│   ├── business-rules.md                    # Business constraints & requirements
│   ├── database-documentation.md            # Table specs, ERD, and constraints
│   ├── qa-testing-guide.md                  # Test cases & Playwright selector reference
│   ├── setup-guide.md                       # Step-by-step local setup guide
│   └── PROJECT-MASTER-DOCUMENT.md           # This master document
│
├── .env.example                             # Root environment variable template
├── .gitignore                               # Git ignore rules for node, build, and tests
└── README.md                                # Project introduction
```

---

## 5. Database Schema & Tables

### Database: `library_management_db`

1. **`users`**:
   - `id`: `SERIAL PRIMARY KEY`
   - `name`: `VARCHAR(100) NOT NULL`
   - `email`: `VARCHAR(255) NOT NULL UNIQUE`
   - `password`: `VARCHAR(255) NOT NULL` (bcrypt hash)
   - `role`: `VARCHAR(20) NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'librarian', 'member'))`
   - `created_at`, `updated_at`: `TIMESTAMPTZ`

2. **`books`**:
   - `id`: `SERIAL PRIMARY KEY`
   - `book_name`: `VARCHAR(255) NOT NULL`
   - `author`: `VARCHAR(255) NOT NULL`
   - `category`: `VARCHAR(100) NOT NULL`
   - `isbn`: `VARCHAR(20) NOT NULL UNIQUE`
   - `total_copies`: `INTEGER NOT NULL CHECK (total_copies > 0)`
   - `available_copies`: `INTEGER NOT NULL CHECK (available_copies >= 0)`
   - `CONSTRAINT chk_available_le_total`: `CHECK (available_copies <= total_copies)`
   - `created_at`, `updated_at`: `TIMESTAMPTZ`

3. **`members`**:
   - `id`: `SERIAL PRIMARY KEY`
   - `full_name`: `VARCHAR(100) NOT NULL`
   - `email`: `VARCHAR(255) NOT NULL UNIQUE`
   - `phone_number`: `VARCHAR(20) NOT NULL`
   - `address`: `TEXT NULL`
   - `created_at`, `updated_at`: `TIMESTAMPTZ`

4. **`book_issues`**:
   - `id`: `SERIAL PRIMARY KEY`
   - `member_id`: `INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT`
   - `book_id`: `INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT`
   - `issue_date`: `DATE NOT NULL DEFAULT CURRENT_DATE`
   - `due_date`: `DATE NOT NULL`
   - `return_date`: `DATE NULL`
   - `status`: `VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue'))`
   - `CONSTRAINT chk_due_date_after_issue`: `CHECK (due_date >= issue_date)`
   - `CONSTRAINT chk_return_date_after_issue`: `CHECK (return_date IS NULL OR return_date >= issue_date)`
   - `created_at`, `updated_at`: `TIMESTAMPTZ`

---

## 6. REST API Endpoints Quick Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Health check & uptime | No |
| `POST` | `/api/auth/login` | Login & generate JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/dashboard/stats` | Real-time library metrics from PostgreSQL | Yes |
| `GET` | `/api/books` | View books (search, filter, paginate) | Yes |
| `GET` | `/api/books/:id` | View individual book & loan count | Yes |
| `POST` | `/api/books` | Add new book to catalog | Yes |
| `PUT` | `/api/books/:id` | Update book details | Yes |
| `DELETE` | `/api/books/:id` | Delete book (validates active loans) | Yes |
| `GET` | `/api/members` | View member directory | Yes |
| `GET` | `/api/members/:id` | View member & active borrowed books | Yes |
| `POST` | `/api/members` | Register new member | Yes |
| `PUT` | `/api/members/:id` | Update member information | Yes |
| `DELETE` | `/api/members/:id` | Delete member (validates active loans) | Yes |
| `GET` | `/api/issues` | View loan records (status filter) | Yes |
| `GET` | `/api/issues/:id` | View loan record details | Yes |
| `POST` | `/api/issues` | Issue book (PostgreSQL Transaction) | Yes |
| `PUT` | `/api/issues/:id/return` | Return book (PostgreSQL Transaction) | Yes |

---

## 7. Execution Commands

### Run Backend Server:
```bash
cd "c:\Users\monis\New Project\library-management-system\backend"
npm run dev
# Server runs on: http://localhost:5000
```

### Run Frontend Application:
```bash
cd "c:\Users\monis\New Project\library-management-system\frontend"
npm start
# Client runs on: http://localhost:3000
```

### Default Login Credentials:
- **Email**: `admin@library.com`
- **Password**: `admin123`
