# Favo Technical Documentation

Welcome to the Favo e-commerce platform documentation! This guide is designed to help you (even if you're a complete beginner) understand how different parts of Favo work together. 

Favo is split into two main codebases:
1. **Frontend (The User Interface):** Located at `d:\AIProjectsgit\Favo - FR\`
2. **Backend (The Core Logic/API):** Located at `d:\AIProjectsgit\Favo\`

Whenever we talk about "CRUD", it stands for **C**reate, **R**ead, **U**pdate, and **D**elete — the four basic functions needed to manage data in a database.

---

## 1. Products & Inventory Module
This module manages the items you sell and keeps track of how much stock you have.

### File Paths
- **Backend API (CRUD):** `d:\AIProjectsgit\Favo\src\app\api\admin\products\route.js` and `...\[id]\route.js`
- **Frontend Admin UI:** `d:\AIProjectsgit\Favo - FR\app\dashboard\products\page.js`

### How it works (Logic)
When you create a product, the backend creates an entry in the `products` table. It also automatically splits off the images into a `product_images` table so you can have multiple photos. Finally, it creates an entry in the `inventory` table for **each size** you specify, initially setting the stock to 0.

### Validations Implemented
Before a product is created or updated, the system checks:
- **Required Fields:** `name`, `description`, and `price` must be provided.
- **Sizes Check:** At least **one size** must be selected (e.g., S, M, L).
- **Images Check:** At least **two product photos** are required to ensure the store looks highly editorial and premium. 

---

## 2. Collections Module
Collections manage the big marketing banners, sliders, and "Hero" sections on the home page and shop page.

### File Paths
- **Backend API (CRUD):** `d:\AIProjectsgit\Favo\src\app\api\admin\collections\route.js` and `...\[id]\route.js`
- **Frontend Admin UI:** `d:\AIProjectsgit\Favo - FR\app\dashboard\collections\page.js`

### How it works (Logic)
Each collection consists of a `title`, `subtitle`, `image_url`, and a `display_order`. The application uses Next.js `formData` to upload actual physical image files to the `public/uploads` directory.

### Validations Implemented
- **Admin Scope:** Only logged-in administrators (verified by a secure token) can create or update collections. 
- **Requirement:** A `title` is absolutely required. 
- **File Upload logic:** If an image is uploaded, it captures the raw buffer size and saves it safely using a timestamp to prevent file naming collisions.

---

## 3. Categories Module
The application organizes clothes dynamically using three tiers: Gender -> Category -> Subcategory.

### File Paths
- **Backend API (CRUD):** `d:\AIProjectsgit\Favo\src\app\api\admin\categories\route.js`
- **Frontend Shop UI:** `d:\AIProjectsgit\Favo - FR\app\shop\page.js`

### How it works (Logic)
Instead of hardcoding "T-shirts" and "Pants", the database holds a `categories` table with the hierarchy. The storefront reads from this to generate the sidebar filters automatically.

---

## 4. Checkout, Orders & Fulfillment Module
This handles the customer's journey when buying something, tracking if it needs to be delivered or picked up.

### File Paths
- **Backend API (CRUD):** `d:\AIProjectsgit\Favo\src\app\api\orders\route.js` (Customer checkout) and `d:\AIProjectsgit\Favo\src\app\api\admin\orders\route.js` (Admin management)
- **Frontend Flows:** `d:\AIProjectsgit\Favo - FR\app\checkout\delivery\page.js` or `pickup\page.js`

### How it works (Logic)
1. The customer loads their cart. 
2. They select a fulfillment type: **DELIVERY** or **PICKUP**.
3. Upon checkout, the API looks at the `inventory` table and ensures there is enough real-world stock. If stock is good, the system decreases the stock, inserts an order into the `orders` table, and logs every individual item in the `order_items` table.
4. It generates a luxurious `FAVO-YYYYMM-XXXXX` order reference number.

### Validations Implemented
- **Stock Check:** Refuses checkout if the item is out of stock.
- **Fulfillment Checks:** If "DELIVERY" is selected, the API requires a matching `delivery_address_id`. If "PICKUP" is chosen, a `pickup_location_id` must be submitted.
- **Address Ownership:** The system securely checks that the delivery address actually belongs to the user currently checking out (to prevent hacking).

---

## 5. Addresses & Phone Validation
Manages where orders will be delivered. 

### File Paths
- **Backend API (CRUD):** `d:\AIProjectsgit\Favo\src\app\api\user\addresses\route.js` 
- **Frontend UI:** `d:\AIProjectsgit\Favo - FR\components\address\AddressFormModal.jsx`

### Validations Implemented
- **Strict Phone Enforcement:** Both the frontend form and backend API strictly require a valid **10-digit number**. Entering any letters or characters is impossible by design.
- **Default Toggle:** A user can flag an address as default, and the API will unset their previous defaults.

---

## 6. Payments Module & Financial Ledger
Simulates the charging of physical credit cards and tracks financial ledgers.

### File Paths
- **Backend API:** `d:\AIProjectsgit\Favo\src\app\api\payment\simulate\route.js` and `admin/payments/route.js`
- **Frontend UI:** `d:\AIProjectsgit\Favo - FR\app\gateway\page.jsx` and `app\dashboard\analytics\page.js`

### How it works (Logic)
Since Favo uses a simulated gateway for its demo state, the gateway (`page.jsx`) captures the credit card info. 
1. The Frontend passes a numerical `orderId` to the backend.
2. The Backend simulates validation—if you pass exactly 16 digits, it "succeeds".
3. A record is securely saved into the `payments` database table with the status of `PAID` or `FAILED`.
4. The **Financial Analytics** page loads these records to populate total revenue and show a transactional ledger.

---

## 7. Admin Dashboard Stats
The dashboard that gives a bird's eye view of how much money the store is making.

### File Paths
- **Backend API:** `d:\AIProjectsgit\Favo\src\app\api\admin\dashboard\route.js`

### How it works (Logic)
Instead of standard CRUD, this API performs massive "Aggregation Queries". It uses SQL math functions (like `SUM()`, `AVG()`, and `COUNT()`) grouped by `MONTH(created_at)`.
This allows the frontend charts to draw exactly how sales perform across the 12 months in the year without doing complicated math in the browser.
