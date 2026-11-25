# Library Management System - QA Testing Master Guide

A practical guide for Manual QA Testers practicing Database Testing (pgAdmin), API Testing (Postman), and UI Automation (Playwright).

---

## 1. Manual UI & Functional Test Cases

### 1.1 Module 1: Admin Login
| Test ID | Test Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-LOGIN-01** | Successful Login | Enter `admin@library.com`, `admin123`, click "Sign In" | Redirects to Dashboard; token saved in `localStorage`; header displays "System Administrator". |
| **TC-LOGIN-02** | Invalid Password | Enter `admin@library.com`, `wrongpass`, click "Sign In" | Red alert: "Invalid email or password." No token generated. |
| **TC-LOGIN-03** | Unregistered Email | Enter `unknown@library.com`, `admin123` | Red alert: "Invalid email or password." |
| **TC-LOGIN-04** | Invalid Email Format | Enter `invalid-email`, `admin123` | Inline validation error: "Please enter a valid email address." |
| **TC-LOGIN-05** | Empty Form Submission | Leave fields empty, click "Sign In" | Inline errors for both email and password fields. |
| **TC-LOGIN-06** | Show/Hide Password | Click "Show" / "Hide" button | Toggles password input type between `text` and `password`. |
| **TC-LOGIN-07** | Logout Functionality | Click "Logout" button in top header | Token removed; user redirected to login screen; back navigation blocked. |

---

### 1.2 Module 2: Dashboard Metrics
| Test ID | Test Scenario | Verification Method | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-DASH-01** | Total Books Metric | Compare UI card with `SELECT COUNT(*) FROM books;` | Counts match exactly. |
| **TC-DASH-02** | Available Books Metric | Compare UI card with `SELECT SUM(available_copies) FROM books;` | Counts match exactly. |
| **TC-DASH-03** | Total Members Metric | Compare UI card with `SELECT COUNT(*) FROM members;` | Counts match exactly. |
| **TC-DASH-04** | Issued Books Metric | Compare UI card with `SELECT COUNT(*) FROM book_issues WHERE status = 'issued';` | Counts match exactly. |
| **TC-DASH-05** | Dynamic Update on Loan | Issue a book $\rightarrow$ refresh Dashboard | Available Books decreases by 1; Issued Books increases by 1. |

---

### 1.3 Module 3: Book Management
| Test ID | Test Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-BOOK-01** | Add Book - Success | Enter valid book details, submit | Book appears in table; status 201; stock badge green. |
| **TC-BOOK-02** | Duplicate ISBN | Enter an existing ISBN (e.g. `978-0132350884`) | Red alert: "A book with ISBN '...' already exists." |
| **TC-BOOK-03** | Zero Total Copies | Set Total Copies = 0 | Inline error: "Total copies must be greater than zero." |
| **TC-BOOK-04** | Available > Total | Set Total = 5, Available = 8 | Inline error: "Available copies cannot exceed total copies." |
| **TC-BOOK-05** | Delete with Active Loans | Try to delete book with ID 1 ("Clean Code") | Deletion blocked with warning: active issue records exist. |
| **TC-BOOK-06** | Search Books | Type "Martin" in search box | Filters table to books authored by or titled Martin. |

---

### 1.4 Module 4: Member Management
| Test ID | Test Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-MEM-01** | Register Member | Enter name, unique email, phone | Member added to table; status 201. |
| **TC-MEM-02** | Duplicate Member Email | Use an already registered email | Rejection alert: duplicate email conflict. |
| **TC-MEM-03** | View Member Active Loans | Click on member name | Details modal displays list of books currently checked out. |
| **TC-MEM-04** | Delete Active Borrower | Try to delete member with ID 1 (Alice) | Deletion blocked: active loan records exist. |

---

### 1.5 Module 5: Book Issue & Return
| Test ID | Test Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-ISSUE-01** | Issue Available Book | Select member, book with copies > 0, set due date, confirm | Issue created; book available count decrements by 1. |
| **TC-ISSUE-02** | Issue Unavailable Book | Attempt to issue book with 0 available copies | UI disables book; backend rejects with 400 error. |
| **TC-ISSUE-03** | Due Date < Issue Date | Set due date earlier than issue date | Form validation error: due date cannot be earlier than issue date. |
| **TC-RETURN-01**| Return Book | Click "Return Book" on active loan, confirm | Status changes to "Returned"; book available copies increments by 1. |
| **TC-RETURN-02**| Prevent Double Return | Verify "Return Book" button on returned item | Button is replaced with "Completed" label; endpoint blocks duplicate returns. |

---

## 2. Database Testing Practice Guide (pgAdmin)

Execute these queries in pgAdmin Query Tool to validate backend behavior:

```sql
-- 1. Verify Stock Consistency Across Entire Inventory
SELECT 
    b.id,
    b.book_name,
    b.total_copies,
    b.available_copies,
    COUNT(bi.id) FILTER (WHERE bi.status = 'issued') AS active_loans,
    (b.total_copies - COUNT(bi.id) FILTER (WHERE bi.status = 'issued')) AS calculated_available
FROM books b
LEFT JOIN book_issues bi ON b.id = bi.book_id
GROUP BY b.id, b.book_name, b.total_copies, b.available_copies;

-- 2. Test Foreign Key Constraint Protection (Negative Scenario)
-- Attempting to delete a member who has borrowed books:
DELETE FROM members WHERE id = 1;
-- Expected PostgreSQL Error:
-- ERROR: update or delete on table "members" violates foreign key constraint "book_issues_member_id_fkey"

-- 3. Test Check Constraint for Negative Copies (Negative Scenario)
UPDATE books SET available_copies = -1 WHERE id = 1;
-- Expected PostgreSQL Error:
-- ERROR: new row for relation "books" violates check constraint "chk_available_copies_non_negative"
```

---

## 3. UI Automation Selector Reference (Playwright Ready)

All interactive elements include stable `data-testid` attributes:

### Authentication
- `login-email`: Email input field
- `login-password`: Password input field
- `toggle-password-visibility`: Show/hide password button
- `login-submit-button`: Submit button
- `logout-button`: Header logout button

### Navigation
- `nav-dashboard`: Sidebar Dashboard tab
- `nav-books`: Sidebar Book Management tab
- `nav-members`: Sidebar Member Management tab
- `nav-issues`: Sidebar Book Issue & Return tab

### Book Management
- `book-search-input`: Search bar
- `book-category-filter`: Category dropdown
- `add-book-button`: Open add book modal button
- `book-form-title`: Book name input
- `book-form-author`: Author input
- `book-form-isbn`: ISBN input
- `book-form-total-copies`: Total copies input
- `book-form-available-copies`: Available copies input
- `save-book-form-btn`: Save button
- `edit-book-btn-<id>`: Edit button for row `<id>`
- `delete-book-btn-<id>`: Delete button for row `<id>`

### Book Issues
- `open-issue-modal-button`: "+ Issue Book" button
- `issue-member-select`: Member dropdown
- `issue-book-select`: Book dropdown
- `issue-due-date-input`: Due date picker
- `confirm-issue-btn`: Confirm issue transaction button
- `return-book-btn-<id>`: Return button for loan `<id>`
- `confirm-return-btn`: Confirm return transaction button
