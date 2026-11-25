-- ============================================================================
-- Library Management System - Seed Data
-- Database Engine: PostgreSQL
-- Database Name: library_management_db
-- ============================================================================

-- Clean existing data before seeding to prevent duplicate key errors
TRUNCATE TABLE book_issues, members, books, users RESTART IDENTITY CASCADE;

-- ----------------------------------------------------------------------------
-- 1. SEED USERS TABLE
-- Default Admin Account:
-- Email:    admin@library.com
-- Password: admin123
-- Hash:     $2b$10$1ZHphztqUkk2jg5Gt3u/.OZ4SPFwhgJ7HJwLBfTjhvkTHFZRZm.Mm (bcrypt, 10 rounds)
-- ----------------------------------------------------------------------------
INSERT INTO users (name, email, password, role)
VALUES 
    ('System Administrator', 'admin@library.com', '$2b$10$1ZHphztqUkk2jg5Gt3u/.OZ4SPFwhgJ7HJwLBfTjhvkTHFZRZm.Mm', 'admin');

-- ----------------------------------------------------------------------------
-- 2. SEED BOOKS TABLE (10 Sample Books)
-- Note: Available copies reflect active loans seeded below
-- ----------------------------------------------------------------------------
INSERT INTO books (book_name, author, category, isbn, total_copies, available_copies)
VALUES 
    ('Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'Software Engineering', '978-0132350884', 5, 4),
    ('The Pragmatic Programmer: Your Journey to Mastery', 'Andrew Hunt, David Thomas', 'Software Engineering', '978-0201616224', 4, 4),
    ('Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 'Computer Science', '978-0201633610', 3, 3),
    ('Introduction to Algorithms', 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest', 'Computer Science', '978-0262033848', 6, 6),
    ('Database System Concepts', 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan', 'Database Systems', '978-0073523323', 4, 4),
    ('JavaScript: The Good Parts', 'Douglas Crockford', 'Web Development', '978-0596517748', 5, 5),
    ('Continuous Delivery: Reliable Software Releases through Build, Test, and Deployment Automation', 'Jez Humble, David Farley', 'DevOps', '978-0321601919', 3, 3),
    ('To Kill a Mockingbird', 'Harper Lee', 'Classic Literature', '978-0060935467', 7, 6),
    ('1984', 'George Orwell', 'Dystopian Fiction', '978-0451524935', 8, 8),
    ('A Brief History of Time', 'Stephen Hawking', 'Science', '978-0553380163', 4, 4);

-- ----------------------------------------------------------------------------
-- 3. SEED MEMBERS TABLE (5 Sample Members)
-- ----------------------------------------------------------------------------
INSERT INTO members (full_name, email, phone_number, address)
VALUES 
    ('Alice Johnson', 'alice.johnson@example.com', '+1-555-0101', '123 Maple Street, Springfield, IL'),
    ('Bob Smith', 'bob.smith@example.com', '+1-555-0102', '456 Oak Avenue, Metropolis, NY'),
    ('Charlie Brown', 'charlie.brown@example.com', '+1-555-0103', '789 Pine Road, Gotham, NJ'),
    ('Diana Prince', 'diana.prince@example.com', '+1-555-0104', '101 Elm Blvd, Star City, CA'),
    ('Evan Wright', 'evan.wright@example.com', '+1-555-0105', '202 Cedar Lane, Central City, MO');

-- ----------------------------------------------------------------------------
-- 4. SEED BOOK_ISSUES TABLE (Sample Loans: 2 Active, 1 Returned)
-- ----------------------------------------------------------------------------
INSERT INTO book_issues (member_id, book_id, issue_date, due_date, return_date, status)
VALUES 
    -- Active issue: Alice borrowed 'Clean Code' (due in 14 days)
    (1, 1, CURRENT_DATE - INTERVAL '3 days', CURRENT_DATE + INTERVAL '11 days', NULL, 'issued'),

    -- Returned issue: Bob borrowed 'The Pragmatic Programmer' and returned it
    (2, 2, CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE - INTERVAL '7 days', 'returned'),

    -- Active issue: Charlie borrowed 'To Kill a Mockingbird' (due in 10 days)
    (3, 8, CURRENT_DATE - INTERVAL '4 days', CURRENT_DATE + INTERVAL '10 days', NULL, 'issued');
