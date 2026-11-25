# Library Management System - Business Rules & Requirements Specification

This document details all functional requirements, business validation rules, constraints, and error scenarios enforced across the Database, Backend APIs, and Frontend UI.

---

## 1. Authentication & Security Business Rules

| ID | Rule Description | Enforcement Layer | Expected Behavior / Status |
| :--- | :--- | :--- | :--- |
| **AUTH-01** | Passwords must never be stored as plain text. | Backend, DB | Hashed using bcrypt with 10 salt rounds before persistence. |
| **AUTH-02** | Login requires valid email and non-empty password. | Frontend, Backend | Returns `400 Bad Request` if missing or malformed. |
| **AUTH-03** | Invalid email or incorrect password must return generic error. | Backend | Returns `401 Unauthorized` ("Invalid email or password") to avoid user enumeration. |
| **AUTH-04** | Protected routes require a valid JWT token. | Backend Middleware | Requests without `Authorization: Bearer <token>` return `401 Unauthorized`. |
| **AUTH-05** | Expired or tampered tokens must be rejected. | Backend, Frontend | Returns `403 Forbidden`; Frontend intercepts and forces logout. |

---

## 2. Book Management Business Rules

| ID | Rule Description | Enforcement Layer | Expected Behavior / Status |
| :--- | :--- | :--- | :--- |
| **BOOK-01** | Required fields: `book_name`, `author`, `category`, `isbn`, `total_copies`. | Frontend, Backend, DB | `NOT NULL` constraint in DB; `400 Bad Request` in API. |
| **BOOK-02** | ISBN must be globally unique across all books. | DB, Backend | `UNIQUE` constraint in DB; Returns `409 Conflict` on duplicate. |
| **BOOK-03** | Total copies must always be greater than 0 ($total > 0$). | DB, Backend, Frontend | `CHECK (total_copies > 0)`; rejects 0 or negative values. |
| **BOOK-04** | Available copies cannot be negative ($available \ge 0$). | DB, Backend, Frontend | `CHECK (available_copies >= 0)`. |
| **BOOK-05** | Available copies cannot exceed total copies ($available \le total$). | DB, Backend, Frontend | `CHECK (available_copies <= total_copies)`. |
| **BOOK-06** | Total copies cannot be reduced below current active loans. | Backend | If a book has 3 active loans, `total_copies` cannot be updated to 2. Returns `400 Bad Request`. |
| **BOOK-07** | Deleting books with active loans is strictly prohibited. | Backend, DB | Returns `400 Bad Request` if `book_issues` has active or historical loans. |

---

## 3. Member Management Business Rules

| ID | Rule Description | Enforcement Layer | Expected Behavior / Status |
| :--- | :--- | :--- | :--- |
| **MEM-01** | Full name, email, and phone number are mandatory. | Frontend, Backend, DB | Validated at all tiers. |
| **MEM-02** | Member email must be unique and follow valid email format. | Backend, DB | Enforced by regex and PostgreSQL unique constraint `members_email_key`. |
| **MEM-03** | Deleting members with active issued books is forbidden. | Backend, DB | Deletion returns `400 Bad Request` with active loan warning. |
| **MEM-04** | Historical loan audit preservation. | DB | Foreign key `ON DELETE RESTRICT` ensures borrowing records are never orphaned. |

---

## 4. Book Issue & Return Business Rules (Transactions)

| ID | Rule Description | Enforcement Layer | Expected Behavior / Status |
| :--- | :--- | :--- | :--- |
| **ISSUE-01** | Member must exist in database prior to issue. | Backend, DB | Foreign key validation; returns `404 Not Found` if member missing. |
| **ISSUE-02** | Book must exist in database prior to issue. | Backend, DB | Foreign key validation; returns `404 Not Found` if book missing. |
| **ISSUE-03** | Books with 0 available copies cannot be issued. | Frontend, Backend | Returns `400 Bad Request` ("Cannot issue 'Title'. All copies are currently issued"). |
| **ISSUE-04** | Available copies decrement on successful issue. | Backend (Transaction) | Decrements `available_copies = available_copies - 1` atomically. |
| **ISSUE-05** | Due date cannot precede issue date ($due\_date \ge issue\_date$). | DB, Backend, Frontend | Enforced by PostgreSQL CHECK constraint `chk_due_date_after_issue`. |
| **RETURN-01** | Cannot return an already returned issue record. | Backend | Checks `status === 'issued'`; returns `400 Bad Request` on duplicate return. |
| **RETURN-02** | Available copies increment on successful return. | Backend (Transaction) | Increments `available_copies = available_copies + 1` atomically. |
| **RETURN-03** | Return date cannot precede issue date. | DB, Backend | Enforced by PostgreSQL CHECK constraint `chk_return_date_after_issue`. |
| **TX-01** | Atomicity of Issue and Return operations. | Backend (PostgreSQL) | Wrapped in `BEGIN ... COMMIT`; automatically triggers `ROLLBACK` on any error. |
