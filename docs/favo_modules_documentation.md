# Favo Backend Modules Detailed Documentation

Welcome! This document provides a step-by-step, noob-friendly breakdown of the 6 main modules in the Favo e-commerce platform. It explains the "what," "where," and "how" of the logic and validations for each module so you and your group members can easily understand the codebase.

---

## 1. Order Management and Cart

**Primary File Location:** `d:\AIProjectsgit\Favo\src\app\api\orders\route.js`

This module handles taking items from a customer's cart and turning them into a real, placed order in the database.

### 🧠 Logic Used
- **Database Transactions (Line 40):** The process uses `connection.beginTransaction()`. This means if any part of the order fails (like a product is out of stock), the entire process is cancelled.
```javascript
    const connection = await db.getConnection();
    await connection.beginTransaction();
```

- **Price Calculation (Lines 44-62):** Instead of trusting the price sent by the frontend, the backend checks the database to get the real price.
```javascript
        const [rows] = await connection.query(
          "SELECT p.price, COALESCE(i.stock_quantity, 0) as stock_quantity FROM products p LEFT JOIN inventory i ON p.id = i.product_id AND i.size = ? WHERE p.id = ?", 
          [item.size || 'OS', item.product_id]
        );
        // total_amount is calculated on backend
        total_amount += (item.price_at_time * item.quantity);
```

- **Inventory Deduction (Lines 94-97):** After the order is placed, the exact quantity purchased is subtracted from the `inventory` table dynamically.
```javascript
        await connection.query(
          "UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE product_id = ? AND size = ?",
          [item.quantity, item.product_id, item.size || 'OS']
        );
```

### 🛡️ Validations
- **Authentication Check (Lines 18-21):** Makes sure a valid user is logged in.
```javascript
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
```

- **Empty Cart Check (Lines 26-28):** Validates that an order actually has items before processing.
```javascript
    if (!items || !items.length) {
      return NextResponse.json({ ok: false, error: "Cart is empty" }, { status: 400, headers: corsHeaders });
    }
```

- **Fulfillment Method Check (Lines 30-36):** Requires the exact address based on the method chosen.
```javascript
    if (delivery_method === 'DELIVERY' && !delivery_address_id) {
      return NextResponse.json({ ok: false, error: "Delivery address is required" }, { status: 400 });
    }
    if (delivery_method === 'PICKUP' && !pickup_location_id) {
      return NextResponse.json({ ok: false, error: "Pickup location is required" }, { status: 400 });
    }
```

- **Address Ownership Security Check (Lines 65-73):** Prevents users from shipping to someone else's private address.
```javascript
      if (delivery_method === 'DELIVERY') {
        const [addressCheck] = await connection.query(
          "SELECT id FROM customer_addresses WHERE id = ? AND user_id = ?",
          [delivery_address_id, user.id || user.userId]
        );
        if (addressCheck.length === 0) {
          throw new Error("Invalid or unauthorized delivery address selected.");
        }
      }
```

---

## 2. Product Management and Inventory

**Primary File Locations:** 
- `d:\AIProjectsgit\Favo\src\app\api\admin\products\route.js` (For Product Data)
- `d:\AIProjectsgit\Favo\src\app\api\admin\inventory\route.js` (For Stock Levels)

This module is responsible for allowing admins to create product listings and assign stock quantities to different sizes.

### 🧠 Logic Used
- **Base Inventory Initialization (`products/route.js`, Lines 96-101):** When a new product is created, the system loops through the selected sizes and automatically creates empty inventory rows (stock = 0).
```javascript
      for (const size of sizes) {
        await connection.query(
          "INSERT INTO inventory (product_id, sku, stock_quantity, low_stock_threshold, size) VALUES (?, ?, ?, ?, ?)",
          [productId, null, 0, 10, size.trim()]
        );
      }
```

### 🛡️ Validations
- **Name and Price Required (`products/route.js`, Lines 64-66):** Makes sure the product has basic identifying details.
```javascript
    if (!name || price === undefined) {
      return NextResponse.json({ ok: false, error: "Name and Price are required" }, { status: 400, headers: corsHeaders });
    }
```

- **Product Details (`products/route.js`, Lines 67-75):** Requires description, at least one size, and two images.
```javascript
    if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
      return NextResponse.json({ ok: false, error: "At least one size is required" }, { status: 400 });
    }
    if (!images || !Array.isArray(images) || images.filter(img => img.trim() !== '').length < 2) {
      return NextResponse.json({ ok: false, error: "At least two product photos are required" }, { status: 400 });
    }
```

- **Duplicate Prevention (`inventory/route.js`, Lines 73-80):** Uses a database-level error catch to stop you from adding identical sizes twice.
```javascript
    if (error.code === 'ER_DUP_ENTRY') {
      if (errorMessage.includes('inventory.product_id')) {
        errorMessage = "Inventory record for this product already exists.";
      }
    }
```

---

## 3. Showcase CMS Management

**Primary File Location:** `d:\AIProjectsgit\Favo\src\app\api\admin\collections\route.js`

This module is the Content Management System (CMS) that allows admins to change the showcase elements (like hero banners or featured collections).

### 🧠 Logic Used
- **File Upload Processing (Lines 69-83):** Handles physical file streams, converts the buffer, and saves the file directly to the `/public/uploads` directory.
```javascript
    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
      
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}

      const filePath = join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      
      image_url = `/uploads/${fileName}`;
    }
```

### 🛡️ Validations
- **Authentication Check (`collections/route.js`, Lines 44-49):** Ensures a user is logged in before checking their role.
```javascript
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
```

- **Admin Only Check (`collections/route.js`, Lines 51-56):** Strictly checks for the admin role to prevent unauthorized access to CMS changes.
```javascript
    if (user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden: admin only" },
        { status: 403 }
      );
    }
```

- **Title Requirement (`collections/route.js`, Lines 85-90):** Ensures every showcase collection or banner has a title before saving.
```javascript
    if (!title) {
      return NextResponse.json(
        { ok: false, error: "Title is required" },
        { status: 400 }
      );
    }
```

---

## 4. Delivery Order Management and Delivery Address

**Primary File Location:** `d:\AIProjectsgit\Favo\src\app\api\user\addresses\route.js`

This module lets customers add, view, and manage their personal shipping addresses.

### 🧠 Logic Used
- **Smart Default Addresses (Lines 60-75):** If a user sets a new address as `is_default`, the system runs a query to update all of their *other* addresses to `is_default = FALSE`.
```javascript
      if (is_default) {
        await connection.query(
          "UPDATE customer_addresses SET is_default = FALSE WHERE user_id = ?",
          [user.id || user.userId]
        );
      }
```

### 🛡️ Validations
- **Required Fields (Lines 48-50):** Ensures no address is saved missing vital physical details like name and street.
```javascript
    if (!full_name || !phone_number || !street_address || !city) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }
```

- **Strict Phone Formatting (Lines 52-54):** Uses a Regex `/^\d{10}$/` to make absolutely sure the phone number contains exactly 10 numbers.
```javascript
    if (!/^\d{10}$/.test(phone_number)) {
      return NextResponse.json({ ok: false, error: "Phone number must be exactly 10 digits" }, { status: 400 });
    }
```

---

## 5. Pickup Order Management and Pickup Address

**Primary File Location:** `d:\AIProjectsgit\Favo\src\app\api\pickup-locations\route.js`

This handles physical store branches where users can choose to go pick up their orders in person.

### 🧠 Logic Used
- **Admin vs Customer View (Lines 17-25):** The `GET` route filters branches depending on whether an admin or user is querying.
```javascript
    let query = "SELECT * FROM pickup_locations";
    
    // Customers only see active locations
    if (!adminMode) {
      query += " WHERE is_active = TRUE";
    }
```

### 🛡️ Validations
- **Required Fields (Lines 55-57):** Makes sure all branch data is available for users.
```javascript
    if (!branch_name || !address_line || !city || !phone_number || !opening_hours) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400, headers: corsHeaders });
    }
```

- **Strict Phone Formatting (Lines 59-61):** 
```javascript
    if (!/^\d{10}$/.test(phone_number)) {
      return NextResponse.json({ ok: false, error: "Phone number must be exactly 10 digits" }, { status: 400 });
    }
```

---

## 6. User, Payment and Security Management

**Primary File Locations:** 
- `d:\AIProjectsgit\Favo\src\app\api\auth\register\route.js` (Registration)
- `d:\AIProjectsgit\Favo\src\app\api\auth\login\route.js` (Login)
- `d:\AIProjectsgit\Favo\src\app\api\payment\simulate\route.js` (Payment)

This combined module handles user registration, secure login, and simulated card payments.

### 🧠 Logic Used
- **Password Hashing (`register/route.js`, Line 48):** Encrypts the password for security.
```javascript
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
```

- **Fake Transaction Automation (`simulate/route.js`, Lines 50-62):** Generates a random receipt ID and automatically updates the order to `PAID`.
```javascript
    // Generate fake transaction ID
    const transactionId = "TXN_" + Math.random().toString(36).substring(2, 10);

    await db.query(
      "UPDATE orders SET status = 'PAID' WHERE id = ?",
      [orderId]
    );
```

### 🛡️ Validations
- **Name, Email, and Password Requirements (`register/route.js`, Lines 20-25):** Core security to require basic identifying info.
```javascript
    if (!name || !email || !password) {
      return NextResponse.json(
        { ok: false, error: "Name, email, and password are required." },
        { status: 400 }
      );
    }
```

- **Email Uniqueness (`register/route.js`, Lines 35-45):** Checks the DB to avoid duplicate accounts.
```javascript
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { ok: false, error: "Email already registered." },
        { status: 409 }
      );
    }
```

- **Email Format Validation (`login/route.js`, Lines 25-30):** Ensures the user inputs a valid email format containing an '@' symbol during login.
```javascript
    if (!email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Invalid email format." },
        { status: 400 }
      );
    }
```

- **Password Length (`register/route.js`, Lines 27-32):** Ensures a safe password length.
```javascript
    if (password.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }
```

- **Credit Card Length Check (`simulate/route.js`, Lines 35-47):** The "fake bank" fails the transaction if the card length is incorrect.
```javascript
    // Fake card validation
    if (cardNumber.length !== 16) {
      try {
        await db.query(
          "INSERT INTO payments (order_id, user_id, amount, status) VALUES (?, ?, ?, 'FAILED')",
          [orderId, user.userId, amount]
        );
      } catch (dbErr) {}

      return NextResponse.json({ ok: false, message: "Payment failed" });
    }
```
