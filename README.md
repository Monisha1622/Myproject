# Library Management System

A real-world full-stack Library Management System designed specifically for practical Quality Assurance (QA) training and testing practice.

## Project Purpose
This project serves as a comprehensive, real-world application for hands-on learning across multiple testing disciplines:
- **Database Testing**: Writing and executing SQL queries, constraint testing, transaction integrity checks, and data consistency validation using PostgreSQL and pgAdmin.
- **API Testing**: Manual exploratory and functional testing of RESTful endpoints using Postman.
- **UI & API Automation**: End-to-end automation, regression testing, and Page Object Model (POM) development using Playwright with JavaScript.
- **Version Control & CI/CD**: Source control workflows with Git & GitHub, and continuous integration pipelines with GitHub Actions.

## Technology Stack
- **Frontend**: React.js, JavaScript, HTML5, CSS3
- **Backend**: Node.js, Express.js (REST APIs)
- **Database**: PostgreSQL (managed via pgAdmin)

## Core Modules
1. **Admin Authentication**: Secure login with JWT and bcrypt password hashing.
2. **Dashboard**: Real-time library metrics (Total Books, Total Members, Available Books, Issued Books).
3. **Book Management**: Full CRUD operations, ISBN uniqueness, and copy tracking.
4. **Member Management**: Full CRUD operations for library members with active loan checks.
5. **Book Issue and Return**: Transaction-safe lending and return workflows enforcing copy constraints.
