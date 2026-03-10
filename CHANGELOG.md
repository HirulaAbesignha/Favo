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
- IT24610824 `src/app/api/orders/[id]/delivery/route.js`- Delivery API route and update delivery method.
- IT24610824 `src/app/api/orders/[id]/pickup/route.js` - Pickup API route
- IT24610824 `src/app/api/pickup-locations/route.js` - Get Pickup Locations API, this helps frontend dropdown 
- IT24610824 - `src/app/api/users/me/route.js` - Implemented users CRUD
- IT24610824 - `src/app/api/admin/pickup-locations/[id]/route.js` - Implemented del and put fucntions on pickup.
- IT24610824 - `src/app/api/admin/pickup-locations/route.js` - Added create function to pickup location.
- IT24610824 - `src/app/api/orders/[id]/payments/route.js` - Added read function to payment.
- IT24610824 - `src/app/api/payments/[id]/route.js` -  Added update and create function to payment.
- IT24610824 - `src/app/api/admin/customers/route.js` - To fetch all customers for the dashboard.
- IT24610824 - `src/app/api/admin/payments/route.js` - To fetch all payments for the dashboard.
- IT24610824 - `src/app/api/admin/addresses/route.js` - To fetch all addresses for the dashboard.
---

### Fixed
- IT24610824 - `src/app/api/admin/pickup-locations/route.js` - Updated API errors.
- IT24610824 - `src/app/api/payments/[id]/route.js` - Fixed Payment PUT function errors.
- IT24610824 - `src/app/api/orders/[id]/payments/route.js` Fixed `params.id` is not being read properly

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