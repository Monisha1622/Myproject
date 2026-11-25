-- ============================================================================
-- Library Management System - QA Practice SQL Queries
-- Database Engine: PostgreSQL
-- Database Name: library_management_db
-- ============================================================================
-- This file contains practical SQL scripts designed for Database Testing.
-- You can run each query individually in pgAdmin Query Tool.
-- ============================================================================

-- ============================================================================
-- 1. BASIC RETRIEVAL (SELECT, WHERE, ORDER BY, LIMIT)
-- ============================================================================

-- 1.1 Retrieve all registered users
SELECT id, name, email, role, created_at 
FROM users;

-- 1.2 Retrieve all books ordered alphabetically by title
SELECT id, book_name, author, category, isbn, total_copies, available_copies
FROM books
ORDER BY book_name ASC;

-- 1.3 Find books by a specific category (WHERE clause)
SELECT id, book_name, author, category, available_copies
FROM books
WHERE category = 'Computer Science';

-- 1.4 Retrieve members with a pagination limit (First 3 members)
SELECT id, full_name, email, phone_number
FROM members
ORDER BY id ASC
LIMIT 3 OFFSET 0;


-- ============================================================================
-- 2. FILTERING AND PATTERN MATCHING (LIKE, ILIKE, IN, BETWEEN, IS NULL)
-- ============================================================================

-- 2.1 Search books with title containing 'Design' (case-insensitive)
SELECT id, book_name, author, isbn
FROM books
WHERE book_name ILIKE '%design%';

-- 2.2 Find books belonging to multiple categories (IN operator)
SELECT id, book_name, category
FROM books
WHERE category IN ('Software Engineering', 'DevOps', 'Web Development');

-- 2.3 Find active issues where the return date has not been recorded yet
SELECT id, member_id, book_id, issue_date, due_date, status
FROM book_issues
WHERE return_date IS NULL AND status = 'issued';

-- 2.4 Find books where total copies are between 4 and 8
SELECT book_name, total_copies
FROM books
WHERE total_copies BETWEEN 4 AND 8;


-- ============================================================================
-- 3. AGGREGATE FUNCTIONS & GROUPING (COUNT, SUM, AVG, GROUP BY, HAVING)
-- ============================================================================

-- 3.1 Calculate library summary statistics (used by Dashboard API)
SELECT 
    COUNT(*) AS total_book_titles,
    SUM(total_copies) AS total_inventory_copies,
    SUM(available_copies) AS total_available_copies,
    (SUM(total_copies) - SUM(available_copies)) AS total_currently_issued
FROM books;

-- 3.2 Total number of registered members
SELECT COUNT(*) AS total_members 
FROM members;

-- 3.3 Count books per category
SELECT category, COUNT(*) AS book_count, SUM(total_copies) AS total_copies
FROM books
GROUP BY category
ORDER BY book_count DESC;

-- 3.4 Categories with more than 1 book title (HAVING clause)
SELECT category, COUNT(*) AS book_count
FROM books
GROUP BY category
HAVING COUNT(*) > 1;

-- 3.5 Count issues by status (issued vs returned)
SELECT status, COUNT(*) AS status_count
FROM book_issues
GROUP BY status;


-- ============================================================================
-- 4. TABLE JOINS (INNER JOIN, LEFT JOIN)
-- ============================================================================

-- 4.1 INNER JOIN: View all issued book records with Member and Book details
SELECT 
    bi.id AS issue_id,
    m.full_name AS member_name,
    m.email AS member_email,
    m.phone_number AS member_phone,
    b.book_name,
    b.isbn,
    bi.issue_date,
    bi.due_date,
    bi.return_date,
    bi.status
FROM book_issues bi
INNER JOIN members m ON bi.member_id = m.id
INNER JOIN books b ON bi.book_id = b.id
ORDER BY bi.id DESC;

-- 4.2 LEFT JOIN: List all members and count how many books they currently have issued
SELECT 
    m.id AS member_id,
    m.full_name,
    m.email,
    COUNT(CASE WHEN bi.status = 'issued' THEN 1 END) AS active_issued_count,
    COUNT(bi.id) AS lifetime_total_issues
FROM members m
LEFT JOIN book_issues bi ON m.id = bi.member_id
GROUP BY m.id, m.full_name, m.email
ORDER BY active_issued_count DESC, m.id ASC;

-- 4.3 LEFT JOIN: List all books and how many times each has been issued
SELECT 
    b.id AS book_id,
    b.book_name,
    b.author,
    b.total_copies,
    b.available_copies,
    COUNT(bi.id) AS times_borrowed
FROM books b
LEFT JOIN book_issues bi ON b.id = bi.book_id
GROUP BY b.id, b.book_name, b.author, b.total_copies, b.available_copies
ORDER BY times_borrowed DESC;


-- ============================================================================
-- 5. SUBQUERIES (EXISTS, IN, Correlated Subqueries)
-- ============================================================================

-- 5.1 Find all members who currently have at least one active issued book
SELECT id, full_name, email 
FROM members
WHERE id IN (
    SELECT member_id 
    FROM book_issues 
    WHERE status = 'issued'
);

-- 5.2 Find members who have NEVER borrowed any book
SELECT id, full_name, email
FROM members m
WHERE NOT EXISTS (
    SELECT 1 
    FROM book_issues bi 
    WHERE bi.member_id = m.id
);

-- 5.3 Find books whose available copies are below the library average
SELECT book_name, available_copies, total_copies
FROM books
WHERE available_copies < (SELECT AVG(available_copies) FROM books);


-- ============================================================================
-- 6. DATA INTEGRITY & DUPLICATE RECORD CHECKING (QA Scenarios)
-- ============================================================================

-- 6.1 Check for duplicate member emails (Should return 0 rows if unique constraint is intact)
SELECT email, COUNT(*) AS duplicate_count
FROM members
GROUP BY email
HAVING COUNT(*) > 1;

-- 6.2 Check for duplicate book ISBNs (Should return 0 rows)
SELECT isbn, COUNT(*) AS duplicate_count
FROM books
GROUP BY isbn
HAVING COUNT(*) > 1;

-- 6.3 Validate available copies consistency:
-- Rule: available_copies must equal total_copies minus active loans
SELECT 
    b.id,
    b.book_name,
    b.total_copies,
    b.available_copies AS recorded_available,
    (b.total_copies - COALESCE(active_loans.active_count, 0)) AS calculated_available,
    CASE 
        WHEN b.available_copies = (b.total_copies - COALESCE(active_loans.active_count, 0)) THEN 'VALID'
        ELSE 'MISMATCH_DETECTED'
    END AS integrity_status
FROM books b
LEFT JOIN (
    SELECT book_id, COUNT(*) AS active_count
    FROM book_issues
    WHERE status = 'issued'
    GROUP BY book_id
) active_loans ON b.id = active_loans.book_id;


-- ============================================================================
-- 7. CONSTRAINT VALIDATION TESTING (Negative Scenarios for QA)
-- ============================================================================

-- 7.1 Test Unique Constraint: Attempting to insert a duplicate member email
-- EXPECTED: ERROR: duplicate key value violates unique constraint "members_email_key"
-- INSERT INTO members (full_name, email, phone_number, address) 
-- VALUES ('Duplicate Test', 'alice.johnson@example.com', '+1-555-9999', 'Test Address');

-- 7.2 Test CHECK Constraint: Attempting to insert available_copies > total_copies
-- EXPECTED: ERROR: new row for relation "books" violates check constraint "chk_available_le_total"
-- INSERT INTO books (book_name, author, category, isbn, total_copies, available_copies)
-- VALUES ('Invalid Copy Test', 'Test Author', 'Testing', '978-0000000001', 5, 10);

-- 7.3 Test CHECK Constraint: Negative available copies
-- EXPECTED: ERROR: new row for relation "books" violates check constraint "chk_available_copies_non_negative"
-- INSERT INTO books (book_name, author, category, isbn, total_copies, available_copies)
-- VALUES ('Negative Test', 'Test Author', 'Testing', '978-0000000002', 5, -1);

-- 7.4 Test Foreign Key Constraint: Deleting a member with active book issues
-- EXPECTED: ERROR: update or delete on table "members" violates foreign key constraint on table "book_issues"
-- DELETE FROM members WHERE id = 1;


-- ============================================================================
-- 8. TRANSACTION TESTING (Book Issue and Return Workflow)
-- ============================================================================

-- 8.1 Simulating a Successful Book Issue (Debit available copy + Create loan record)
BEGIN;
    -- Step 1: Decrement available copies of book with id 4
    UPDATE books
    SET available_copies = available_copies - 1
    WHERE id = 4 AND available_copies > 0;

    -- Step 2: Insert the issue record
    INSERT INTO book_issues (member_id, book_id, issue_date, due_date, status)
    VALUES (4, 4, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 'issued');
COMMIT;

-- 8.2 Simulating a Rollback (e.g., when an error occurs during issue)
BEGIN;
    UPDATE books
    SET available_copies = available_copies - 1
    WHERE id = 5;

    -- Simulate failure condition: rollback everything
    ROLLBACK;

-- 8.3 Simulating Book Return (Credit available copy + Mark status returned)
BEGIN;
    -- Step 1: Mark issue as returned
    UPDATE book_issues
    SET status = 'returned',
        return_date = CURRENT_DATE
    WHERE id = 1 AND status = 'issued';

    -- Step 2: Increment available copies
    UPDATE books
    SET available_copies = available_copies + 1
    WHERE id = (SELECT book_id FROM book_issues WHERE id = 1);
COMMIT;


-- ============================================================================
-- 9. SPECIFIC AUDIT & HISTORY QUERIES
-- ============================================================================

-- 9.1 Member Issue History (For Member ID 1)
SELECT 
    bi.id AS issue_id,
    b.book_name,
    b.author,
    b.isbn,
    bi.issue_date,
    bi.due_date,
    bi.return_date,
    bi.status
FROM book_issues bi
INNER JOIN books b ON bi.book_id = b.id
WHERE bi.member_id = 1
ORDER BY bi.issue_date DESC;

-- 9.2 Book Issue History (For Book ID 1)
SELECT 
    bi.id AS issue_id,
    m.full_name AS borrowed_by,
    m.email,
    bi.issue_date,
    bi.due_date,
    bi.return_date,
    bi.status
FROM book_issues bi
INNER JOIN members m ON bi.member_id = m.id
WHERE bi.book_id = 1
ORDER BY bi.issue_date DESC;

-- 9.3 Overdue Books Query (Books issued whose due_date < CURRENT_DATE)
SELECT 
    bi.id AS issue_id,
    m.full_name AS member_name,
    m.phone_number,
    b.book_name,
    bi.issue_date,
    bi.due_date,
    (CURRENT_DATE - bi.due_date) AS days_overdue
FROM book_issues bi
INNER JOIN members m ON bi.member_id = m.id
INNER JOIN books b ON bi.book_id = b.id
WHERE bi.status = 'issued' 
  AND bi.due_date < CURRENT_DATE;
