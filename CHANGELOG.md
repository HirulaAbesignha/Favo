# CHANGELOG – FAVO

All notable changes to this project will be documented in this file.

---

## [Unreleased]

### Added 
- IT24610824 `src/app/api/auth/register/route.js` - Register API Routes with valiidations, passwordHash and email checkers.
- IT24610824 `src/app/api/auth/login/route.js` - Login Routes with find users, compare and check passwords, an token generation.
- IT24610824 `src/app/lib/auth.js` - Added JWT verification for user logins.
- IT24610824 `src/app/api/auth/test-protected/route.js` - Tested JWT verification API route.
- IT24610824 `src/app/payment/simulate/route.js` - Fake card vallidation and transaction ID.

---

## [0.1.0] – Initial Project Setup

### Added
- Initialized Next.js project
- Created project structure
- Added docs folder (API contract, DB schema, branching guide)
- Configured GitHub repository and dev branch

---

## [0.2.0] – Database Design Phase

### Added
- Designed MySQL schema
- Created tables: users, products, orders, payments

---

## [0.3.0] – Showcase Module

### Added
- Showcase frontend UI
- /api/designs endpoint