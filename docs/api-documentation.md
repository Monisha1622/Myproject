# Library Management System - REST API Documentation

This document contains full specifications for all REST APIs in the Library Management System.
Designed for QA testers performing Manual API Testing in Postman and future Playwright API automation.

---

## 1. Global API Conventions

- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer token in the request header:
  ```http
  Authorization: Bearer <your_jwt_token_here>
  ```
- **Standard Response Structure**:
  - Success: `{ "success": true, ... }`
  - Failure: `{ "success": false, "message": "...", "errors": [...] }`

---

## 2. Authentication Endpoints

### 2.1 Admin Login
- **Method**: `POST`
- **URL**: `/auth/login`
- **Auth Required**: No
- **Headers**:
  ```http
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "email": "admin@library.com",
    "password": "admin123"
  }
  ```
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Login successful.",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "name": "System Administrator",
        "email": "admin@library.com",
        "role": "admin"
      }
    }
    ```
- **Error Responses**:
  - **Status**: `400 Bad Request` (Missing email or password)
    ```json
    {
      "success": false,
      "message": "Validation failed.",
      "errors": ["Email is required.", "Password is required."]
    }
    ```
  - **Status**: `401 Unauthorized` (Invalid credentials)
    ```json
    {
      "success": false,
      "message": "Invalid email or password."
    }
    ```

---

### 2.2 Get Current User Profile
- **Method**: `GET`
- **URL**: `/auth/me`
- **Auth Required**: Yes (`Bearer <token>`)
- **Headers**:
  ```http
  Authorization: Bearer <token>
  ```
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "user": {
        "id": 1,
        "name": "System Administrator",
        "email": "admin@library.com",
        "role": "admin",
        "created_at": "2026-11-14T14:15:00.000Z",
        "updated_at": "2026-11-14T14:15:00.000Z"
      }
    }
    ```
- **Error Response**:
  - **Status**: `401 Unauthorized` (Missing token)
    ```json
    {
      "success": false,
      "message": "Access denied. No authorization header provided."
    }
    ```

---

## 3. Book Management Endpoints

### 3.1 Get All Books
- **Method**: `GET`
- **URL**: `/books`
- **Auth Required**: Yes
- **Query Parameters**:
  - `search` (optional): Case-insensitive keyword matching book name, author, or ISBN.
  - `category` (optional): Exact category filter.
  - `page` (optional, default `1`): Page number.
  - `limit` (optional, default `10`): Items per page.
  - `sort_by` (optional, default `id`): Column to sort by (`id`, `book_name`, `author`, `category`, `isbn`, `total_copies`, `available_copies`).
  - `order` (optional, default `ASC`): `ASC` or `DESC`.
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "totalRecords": 10,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 10,
      "books": [
        {
          "id": 1,
          "book_name": "Clean Code: A Handbook of Agile Software Craftsmanship",
          "author": "Robert C. Martin",
          "category": "Software Engineering",
          "isbn": "978-0132350884",
          "total_copies": 5,
          "available_copies": 4,
          "created_at": "2026-11-14T14:15:00.000Z",
          "updated_at": "2026-11-14T14:15:00.000Z"
        }
      ]
    }
    ```

---

### 3.2 Get Book by ID
- **Method**: `GET`
- **URL**: `/books/:id`
- **Auth Required**: Yes
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "book": {
        "id": 1,
        "book_name": "Clean Code: A Handbook of Agile Software Craftsmanship",
        "author": "Robert C. Martin",
        "category": "Software Engineering",
        "isbn": "978-0132350884",
        "total_copies": 5,
        "available_copies": 4,
        "active_loans": 1,
        "created_at": "2026-11-14T14:15:00.000Z",
        "updated_at": "2026-11-14T14:15:00.000Z"
      }
    }
    ```
- **Error Response**:
  - **Status**: `404 Not Found`
    ```json
    {
      "success": false,
      "message": "Book with ID 999 not found."
    }
    ```

---

### 3.3 Create New Book
- **Method**: `POST`
- **URL**: `/books`
- **Auth Required**: Yes
- **Headers**:
  ```http
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "book_name": "Refactoring: Improving the Design of Existing Code",
    "author": "Martin Fowler",
    "category": "Software Engineering",
    "isbn": "978-0134757599",
    "total_copies": 5,
    "available_copies": 5
  }
  ```
- **Successful Response**:
  - **Status**: `201 Created`
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Book created successfully.",
      "book": {
        "id": 11,
        "book_name": "Refactoring: Improving the Design of Existing Code",
        "author": "Martin Fowler",
        "category": "Software Engineering",
        "isbn": "978-0134757599",
        "total_copies": 5,
        "available_copies": 5,
        "created_at": "2026-11-14T14:30:00.000Z",
        "updated_at": "2026-11-14T14:30:00.000Z"
      }
    }
    ```
- **Error Responses**:
  - **Status**: `400 Bad Request` (Validation errors, negative copies, available > total)
    ```json
    {
      "success": false,
      "message": "Validation failed.",
      "errors": ["Total copies must be an integer greater than zero."]
    }
    ```
  - **Status**: `409 Conflict` (Duplicate ISBN)
    ```json
    {
      "success": false,
      "message": "A book with ISBN '978-0132350884' already exists."
    }
    ```

---

### 3.4 Update Book
- **Method**: `PUT`
- **URL**: `/books/:id`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "book_name": "Clean Code: A Handbook of Agile Software Craftsmanship (Revised)",
    "author": "Robert C. Martin",
    "category": "Software Engineering",
    "isbn": "978-0132350884",
    "total_copies": 6,
    "available_copies": 5
  }
  ```
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Book updated successfully.",
      "book": { ... }
    }
    ```
- **Error Responses**:
  - **Status**: `400 Bad Request` (Attempting to reduce total copies below active loans count)
  - **Status**: `404 Not Found` (Book ID not found)
  - **Status**: `409 Conflict` (ISBN collision with another book)

---

### 3.5 Delete Book
- **Method**: `DELETE`
- **URL**: `/books/:id`
- **Auth Required**: Yes
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Book with ID 10 deleted successfully."
    }
    ```
- **Error Responses**:
  - **Status**: `400 Bad Request` (Book has active or historical loans in `book_issues`)
    ```json
    {
      "success": false,
      "message": "Cannot delete book. There are 1 active issue records for this book."
    }
    ```
  - **Status**: `404 Not Found` (Book does not exist)

---

## 4. Member Management Endpoints

### 4.1 Get All Members
- **Method**: `GET`
- **URL**: `/members`
- **Auth Required**: Yes
- **Query Parameters**:
  - `search` (optional): Matches name, email, or phone.
  - `page` (optional, default `1`).
  - `limit` (optional, default `10`).
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "totalRecords": 5,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 10,
      "members": [
        {
          "id": 1,
          "full_name": "Alice Johnson",
          "email": "alice.johnson@example.com",
          "phone_number": "+1-555-0101",
          "address": "123 Maple Street, Springfield, IL",
          "created_at": "2026-11-14T14:15:00.000Z",
          "updated_at": "2026-11-14T14:15:00.000Z"
        }
      ]
    }
    ```

---

### 4.2 Get Member by ID
- **Method**: `GET`
- **URL**: `/members/:id`
- **Auth Required**: Yes
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "member": {
        "id": 1,
        "full_name": "Alice Johnson",
        "email": "alice.johnson@example.com",
        "phone_number": "+1-555-0101",
        "address": "123 Maple Street, Springfield, IL",
        "active_loans": [
          {
            "issue_id": 1,
            "book_id": 1,
            "book_name": "Clean Code: A Handbook of Agile Software Craftsmanship",
            "isbn": "978-0132350884",
            "issue_date": "2026-11-11",
            "due_date": "2026-11-25",
            "status": "issued"
          }
        ]
      }
    }
    ```

---

### 4.3 Create New Member
- **Method**: `POST`
- **URL**: `/members`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "full_name": "Grace Hopper",
    "email": "grace.hopper@example.com",
    "phone_number": "+1-555-0199",
    "address": "900 Navy Yard, Arlington, VA"
  }
  ```
- **Successful Response**:
  - **Status**: `201 Created`
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Member created successfully.",
      "member": {
        "id": 6,
        "full_name": "Grace Hopper",
        "email": "grace.hopper@example.com",
        "phone_number": "+1-555-0199",
        "address": "900 Navy Yard, Arlington, VA",
        "created_at": "2026-11-14T14:35:00.000Z",
        "updated_at": "2026-11-14T14:35:00.000Z"
      }
    }
    ```
- **Error Responses**:
  - **Status**: `400 Bad Request` (Missing fields or invalid email)
  - **Status**: `409 Conflict` (Email already registered)

---

### 4.4 Update Member
- **Method**: `PUT`
- **URL**: `/members/:id`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "full_name": "Alice Johnson Smith",
    "email": "alice.smith@example.com",
    "phone_number": "+1-555-0101",
    "address": "777 New Elm St, Springfield, IL"
  }
  ```
- **Successful Response**:
  - **Status**: `200 OK`

---

### 4.5 Delete Member
- **Method**: `DELETE`
- **URL**: `/members/:id`
- **Auth Required**: Yes
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Member with ID 5 deleted successfully."
    }
    ```
- **Error Responses**:
  - **Status**: `400 Bad Request` (Member currently has active loan records)
  - **Status**: `404 Not Found` (Member does not exist)

---

## 5. Book Issue & Return Endpoints

### 5.1 Issue a Book (Transaction Protected)
- **Method**: `POST`
- **URL**: `/issues`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "member_id": 4,
    "book_id": 4,
    "issue_date": "2026-11-14",
    "due_date": "2026-11-28"
  }
  ```
- **Successful Response**:
  - **Status**: `201 Created`
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Book issued successfully.",
      "issue": {
        "id": 4,
        "member_id": 4,
        "book_id": 4,
        "issue_date": "2026-11-14",
        "due_date": "2026-11-28",
        "return_date": null,
        "status": "issued",
        "member_name": "Diana Prince",
        "book_name": "Introduction to Algorithms",
        "remaining_available_copies": 5
      }
    }
    ```
- **Error Responses**:
  - **Status**: `400 Bad Request`:
    - If `available_copies <= 0` ("Cannot issue 'Book Title'. All copies are currently issued (0 available).")
    - If `due_date < issue_date` ("due_date must not be earlier than the issue_date.")
  - **Status**: `404 Not Found` (Member or Book ID does not exist)

---

### 5.2 Return an Issued Book (Transaction Protected)
- **Method**: `PUT`
- **URL**: `/issues/:id/return`
- **Auth Required**: Yes
- **Request Body**:
  ```json
  {
    "return_date": "2026-11-14"
  }
  ```
  *(Note: `return_date` is optional; if omitted, defaults to the current system date).*
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "message": "Book returned successfully.",
      "issue": {
        "id": 1,
        "member_id": 1,
        "book_id": 1,
        "issue_date": "2026-11-11",
        "due_date": "2026-11-25",
        "return_date": "2026-11-14",
        "status": "returned"
      },
      "book": {
        "id": 1,
        "book_name": "Clean Code: A Handbook of Agile Software Craftsmanship",
        "total_copies": 5,
        "available_copies": 5
      }
    }
    ```
- **Error Responses**:
  - **Status**: `400 Bad Request` (Attempting to return an already returned issue record)
    ```json
    {
      "success": false,
      "message": "This book has already been returned on 2026-11-14."
    }
    ```
  - **Status**: `404 Not Found` (Issue ID not found)

---

### 5.3 Get All Issue Records
- **Method**: `GET`
- **URL**: `/issues`
- **Auth Required**: Yes
- **Query Parameters**:
  - `status` (optional): `issued`, `returned`, or `overdue`.
  - `member_id` (optional): Filter loans by specific member.
  - `book_id` (optional): Filter loans by specific book.
  - `search` (optional): Search by member name, book name, or ISBN.
  - `page` (optional, default `1`).
  - `limit` (optional, default `10`).
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "totalRecords": 3,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 10,
      "issues": [
        {
          "id": 1,
          "member_id": 1,
          "member_name": "Alice Johnson",
          "member_email": "alice.johnson@example.com",
          "member_phone": "+1-555-0101",
          "book_id": 1,
          "book_name": "Clean Code: A Handbook of Agile Software Craftsmanship",
          "book_author": "Robert C. Martin",
          "book_isbn": "978-0132350884",
          "issue_date": "2026-11-11",
          "due_date": "2026-11-25",
          "return_date": null,
          "status": "issued",
          "is_overdue": false,
          "created_at": "2026-11-14T14:15:00.000Z"
        }
      ]
    }
    ```

---

### 5.4 Get Issue Details by ID
- **Method**: `GET`
- **URL**: `/issues/:id`
- **Auth Required**: Yes
- **Successful Response**:
  - **Status**: `200 OK`

---

## 6. Dashboard Endpoints

### 6.1 Get Dashboard Statistics
- **Method**: `GET`
- **URL**: `/dashboard/stats`
- **Auth Required**: Yes
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "success": true,
      "stats": {
        "totalBooks": 10,
        "totalCopies": 50,
        "totalMembers": 5,
        "availableBooks": 48,
        "issuedBooks": 2,
        "overdueBooks": 0,
        "returnedBooks": 1
      },
      "recentActivities": [
        {
          "id": 3,
          "member_name": "Charlie Brown",
          "book_name": "To Kill a Mockingbird",
          "issue_date": "2026-11-10",
          "due_date": "2026-11-24",
          "return_date": null,
          "status": "issued"
        }
      ]
    }
    ```

---

## 7. Health Check Endpoint

### 7.1 Server Health Status
- **Method**: `GET`
- **URL**: `/health`
- **Auth Required**: No
- **Successful Response**:
  - **Status**: `200 OK`
  - **Body**:
    ```json
    {
      "status": "UP",
      "timestamp": "2026-11-14T14:40:00.000Z",
      "service": "Library Management System Backend API"
    }
    ```
