-- ============================================================================
-- Library Management System - Database Schema
-- Database Engine: PostgreSQL
-- Database Name: library_management_db
-- ============================================================================

-- Ensure script is idempotent: Drop existing tables in reverse dependency order if re-running
DROP TABLE IF EXISTS book_issues CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Optional: Drop trigger function if exists
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- ----------------------------------------------------------------------------
-- 1. Automatic Timestamp Update Function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. USERS TABLE (System Administrators and Staff)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_role CHECK (role IN ('admin', 'librarian', 'member'))
);

-- Index for fast authentication lookup by email
CREATE INDEX idx_users_email ON users(email);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 3. BOOKS TABLE (Inventory of Library Books)
-- ----------------------------------------------------------------------------
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    book_name VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    isbn VARCHAR(20) NOT NULL UNIQUE,
    total_copies INTEGER NOT NULL,
    available_copies INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_total_copies_positive CHECK (total_copies > 0),
    CONSTRAINT chk_available_copies_non_negative CHECK (available_copies >= 0),
    CONSTRAINT chk_available_le_total CHECK (available_copies <= total_copies)
);

-- Indexes for searching books by ISBN, Category, and Name
CREATE INDEX idx_books_isbn ON books(isbn);
CREATE INDEX idx_books_category ON books(category);
CREATE INDEX idx_books_name ON books(book_name);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER trg_books_updated_at
BEFORE UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 4. MEMBERS TABLE (Registered Library Patrons)
-- ----------------------------------------------------------------------------
CREATE TABLE members (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for member search by email and phone
CREATE INDEX idx_members_email ON members(email);
CREATE INDEX idx_members_phone ON members(phone_number);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER trg_members_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. BOOK_ISSUES TABLE (Transactions of Issued and Returned Books)
-- ----------------------------------------------------------------------------
CREATE TABLE book_issues (
    id SERIAL PRIMARY KEY,
    member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'issued',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_issue_status CHECK (status IN ('issued', 'returned', 'overdue')),
    CONSTRAINT chk_due_date_after_issue CHECK (due_date >= issue_date),
    CONSTRAINT chk_return_date_after_issue CHECK (return_date IS NULL OR return_date >= issue_date)
);

-- Indexes for foreign keys and status queries (critical for JOIN performance)
CREATE INDEX idx_book_issues_member_id ON book_issues(member_id);
CREATE INDEX idx_book_issues_book_id ON book_issues(book_id);
CREATE INDEX idx_book_issues_status ON book_issues(status);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER trg_book_issues_updated_at
BEFORE UPDATE ON book_issues
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
