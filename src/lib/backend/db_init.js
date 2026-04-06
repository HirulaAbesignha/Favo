const pool = require("./db");

async function initDB() {
    try {
        // 1. Carts table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("carts table ready.");

        // 2. Cart Items table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cart_id INT NOT NULL,
        product_id INT NOT NULL,
        variant_id INT,
        qty INT NOT NULL CHECK (qty > 0),
        price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE
      )
    `);
        console.log("cart_items table ready.");

        // 3. Orders table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        delivery_method VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log("orders table ready.");

        // 4. Order Items table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        variant_id INT,
        qty INT NOT NULL CHECK (qty > 0),
        unit_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
        console.log("order_items table ready.");

        console.log("Database initialized successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error initializing DB:", error);
        process.exit(1);
    }
}

initDB();
