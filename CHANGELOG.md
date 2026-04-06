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
- IT24610824 - `src/middleware.js` - Middleware that handles CORS headers for the entire API.


- IT24101084 -  src/app/api/admin/products/route.js - Added product CRUD API route with create and read functions for product management.
- IT24101084 - src/app/api/admin/products/[id]/route.js - Added update and delete functions for individual products.
- IT24101084 - src/app/dashboard/products/page.js - Added admin product management UI for creating, viewing, editing, and deleting products.
- IT24101084 - src/app/api/admin/products/route.js - Implemented validations for required fields such as name, description, and price.
- IT24101084 - src/app/api/admin/products/route.js - Added size validation to ensure at least one size is selected before creating a product.
- IT24101084 - src/app/api/admin/products/route.js - Added image validation to require at least two product images for each product.
- IT24101084 - src/app/api/admin/products/route.js - Implemented logic to store product data in the products table.
- IT24101084 - src/app/api/admin/products/route.js - Added logic to split and store multiple product images in the product_images table.
- IT24101084 - src/app/api/admin/products/route.js - Implemented automatic inventory record creation for each selected size with default stock values.
- IT24101084 - src/app/api/admin/products/[id]/route.js - Added product update logic with inventory and image handling.
- IT24101084 - src/app/api/admin/products/[id]/route.js - Added delete logic for removing products and related records safely.
- IT24101084 - src/app/dashboard/products/page.js - Integrated frontend admin panel with backend product APIs.
- IT24101084 - src/app/dashboard/products/page.js - Added product form handling for product details, sizes, pricing, and images.
- IT24101084 - src/app/dashboard/products/page.js - Added product listing interface for easier inventory and product management in admin dashboard.
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