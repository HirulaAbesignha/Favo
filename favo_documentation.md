# Favo Technical Documentation

Welcome to the comprehensive Favo e-commerce platform documentation! This guide breaks down the underlying system architecture, ensuring you understand exactly what the logic is behind the platform, how CRUD (Create, Read, Update, Delete) operates, and crucially what strict validations exist module by module.

Favo is split into two main codebases:
1. **Frontend (The User Interface):** Located at `d:\AIProjectsgit\Favo - FR\`
2. **Backend (The Core Logic/API):** Located at `d:\AIProjectsgit\Favo\`

---

## 1. Authentication Module

### File Locations
- **Backend APIs:** `d:\AIProjectsgit\Favo\src\app\api\auth\register\route.js` and `api\auth\login\route.js`
- **Frontend UIs:** `app\register\page.js` and `app\login\page.js`

### CRUD Operations
- **Create:** User registers for a new account.
- **Read:** Login authenticates a user's details against the database.

### Validations (Compulsory)
- Passwords must meet a minimum length of 6 characters.
- Requires both a valid email format and an exact matching password confirmation when registering.
- Email uniqueness constraint strictly enforced (no overlapping accounts).

### Core Logic
Uses a stateless JWT (JSON Web Token) approach securely stored either in cookies or headers. Passwords are authentically hashed before persisting to the DB, meaning the true string is never exposed physically.

---

## 2. Addresses Management Module

### File Locations
- **Backend APIs:** `d:\AIProjectsgit\Favo\src\app\api\user\addresses\route.js`
- **Frontend UIs:** `components\address\AddressFormModal.jsx` and `app\checkout\delivery\page.js`

### CRUD Operations
- **Create:** Users can add new dynamic shipping destinations.
- **Read:** Loads an array of addresses specifically bound to the logged-in user.
- **Update:** Users can alter their addresses and select a "Set as Default" flag.
- **Delete:** Users can securely remove a specific old address.

### Validations (Compulsory)
- **Strict Phone Enforcement:** Both frontend UI rules and backend validations strictly compel the input to be an exact **10-digit number**. Letters or spaces are rejected.
- **Ownership Scoping:** The user must natively "own" the address ID to update or delete it.

### Core Logic
When a user targets a new address as their "Default", the system automatically performs an unflagging cycle on their previously defaulted addresses. Address bindings are hard-linked to the user's secure token ID.

---

## 3. Products Module

### File Locations
- **Backend APIs:** `src\app\api\admin\products\route.js` and `...\[id]\route.js`
- **Frontend UIs:** `app\dashboard\products\page.js` (Admin) and `app\shop\page.js` (Customer view)

### CRUD Operations
- **Create:** Admin produces a structured product offering.
- **Read:** Fetch multiple listings with pagination/filters, or a specific single item by ID.
- **Update:** Apply discounts or modify descriptions.
- **Delete:** Archiving/deleting stock offerings securely.

### Validations (Compulsory)
- Required schema payloads: `name`, `description`, `price`, `category_id`.
- Requires a minimum of **two product photos** to ensure premium visual aesthetics.
- Admin secure scope token required for all writes.

### Core Logic
Splits relational creation. The master product initializes, then the system recursively loops and bulk inserts the respective images into the `product_images` cross-table.

---

## 4. Inventory & Sizes Module

### File Locations
- **Backend APIs:** `src\app\api\admin\inventory\route.js` and `...\[id]\route.js`
- **Frontend UIs:** `app\dashboard\inventory\page.js`

### CRUD Operations
- **Create:** Defines stock levels strictly per product and per explicitly mapped **Size** (e.g., S, M).
- **Read:** Displays aggregates of available unit volume.
- **Update:** Restocking bulk volumes per specific size variation.
- **Delete:** Drop the inventory tracker for a discontinued variation.

### Validations (Compulsory)
- Negative inventory amounts are fully forbidden by constraints.
- Explicit combinations of `product_id` + `size` must be definitively unique per row mapping. Cannot duplicate a "Size M" twice.

### Core Logic
Handles sizing matrix logistics. It pairs with a `low_stock_threshold` to visually alert the administration when garments fall below warning volumes.

---

## 5. Orders, Checkout & Fulfillment Module

### File Locations
- **Backend APIs:** `src\app\api\orders\route.js` (Customer checkout) and `src\app\api\admin\orders\route.js` (Management)
- **Frontend flows:** `app\checkout\delivery\page.js` and `app\checkout\pickup\page.js`

### CRUD Operations
- **Create:** Customer converts cart contents into a locked transaction.
- **Read:** Admins audit active lifecycles; customers check past histories.
- **Update:** Admin flags statuses via states (e.g. `PENDING`, `SHIPPED`, `DELIVERED`).
- **Delete:** Cancelling physical fulfillment operations.

### Validations (Compulsory)
- **Stock Barrier Check:** It is categorically impossible to complete checkout if a requested item crosses the available size-centric physical stock on hand.
- Fulfillment parameter binding: If purchasing via `DELIVERY`, a `delivery_address_id` payload must map safely. If via `PICKUP`, the `pickup_location_id` is structurally required.

### Core Logic
Operates within an atomic transaction. Upon checkout, logic correctly binds the specified `size` from the cart, deducts exact matches from the `inventory` table securely, wraps a `FAVO-XX-XX` transactional reference code, and moves items formally to the `order_items` table. 

---

## 6. Categories Module

### File Locations
- **Backend APIs:** `src\app\api\admin\categories\route.js`
- **Frontend UIs:** `app\dashboard\categories\page.js`

### CRUD Operations
- **Create:** Admin mounts a new root or child category.
- **Read:** Pull hierarchically mapped collections formatting (Gender -> Category -> Subcategory).
- **Update:** Re-titling hierarchical tree values.
- **Delete:** Removal of taxonomy categories.

### Validations (Compulsory)
- Strict Foreign Key constraints prohibit the deletion of an active Category that relies on populated nested child product records.

### Core Logic
Uses a `parent_id` parameter to orchestrate multi-tiered self-referencing. This lets the backend output pure trees consumed seamlessly by the frontend filtration interfaces.

---

## 7. Payments Module (Simulated)

### File Locations
- **Backend APIs:** `src\app\api\payment\simulate\route.js` and `api\cards\route.js`
- **Frontend flows:** `app\gateway\page.jsx`

### CRUD Operations
- **Create (Transact):** Pushing arbitrary card numbers triggers simulated clearing.
- **Read:** Generates ledger trails for Analytics Dashboard visual consumptions.

### Validations (Compulsory)
- Validates the incoming Mock Credit Card parameter structurally—asserting it measures precisely 16 digits prior to triggering a clearance phase.

### Core Logic
Simulates a bank response network. Automatically inserts an immutable entry into the `payments` registry mapping against `order_id` flagged fully as `PAID`.

---

## 8. Dashboard Stats & Analytics

### File Locations
- **Backend APIs:** `src\app\api\admin\dashboard\route.js`
- **Frontend UIs:** `app\dashboard\page.js`

### Core Logic (No CRUD)
Rather than executing raw CRUD, the analytics module performs highly concurrent aggregation. Using functional SQL components (e.g., `SUM(total_amount)`, `COUNT()`, and dynamic groupings mapped by `MONTH()`), the logic synthesizes historical datasets instantly so chart libraries in the admin viewport can render performance velocities structurally.
