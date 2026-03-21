const mysql = require("mysql2/promise");

async function main() {
  const db = mysql.createPool({
    uri: "mysql://root:Denji@2003@localhost:3306/favo",
    connectionLimit: 10,
  });

  try {
    console.log("Fetching products...");
    let [products] = await db.query("SELECT id, name FROM products");
    
    if (products.length === 0) {
      console.log("No products found! Creating dummy products...");
      const [catResult] = await db.query("INSERT INTO categories (name) VALUES (?)", ["Dresses"]);
      const catId = catResult.insertId;

      await db.query("INSERT INTO products (category_id, name, description, price, is_active) VALUES (?, ?, ?, ?, ?)", [catId, "Ethereal Silk Gown", "Evening Wear from Garden of Dreams", 4250.00, true]);
      await db.query("INSERT INTO products (category_id, name, description, price, is_active) VALUES (?, ?, ?, ?, ?)", [catId, "Midnight Clasp Bag", "Accessories from Core Collection", 1890.00, true]);
      await db.query("INSERT INTO products (category_id, name, description, price, is_active) VALUES (?, ?, ?, ?, ?)", [catId, "Velvet Opera Coat", "Outerwear from Garden of Dreams", 6400.00, true]);
      
      const [newProducts] = await db.query("SELECT id, name FROM products");
      products = newProducts;
    } else {
        console.log(`Found ${products.length} products to seed inventory for.`);
    }

    for (let i = 0; i < products.length; i++) {
        const prod = products[i];
        
        const stock = [14, 3, 8, 1][i % 4] || Math.floor(Math.random() * 20);
        const skuPrefix = prod.name ? prod.name.replace(/[^A-Za-z]/g, '').substring(0, 3).toUpperCase() : "PRD";
        const sku = `FAV-${skuPrefix}-00${prod.id}`;
        
        try {
            await db.query(
                "INSERT INTO inventory (product_id, sku, stock_quantity, low_stock_threshold) VALUES (?, ?, ?, ?)",
                [prod.id, sku, stock, 10]
            );
            console.log(`Added inventory for ${prod.name}: Qty ${stock}, SKU ${sku}`);
        } catch (err) {
            console.log(`Could not insert for ${prod.name} (maybe exists) - ${err.message}`);
        }
    }
    
    console.log("Successfully seeded inventory database!");
  } catch (error) {
    console.error("Error inserting inventory data:", error.message);
  } finally {
    await db.end();
  }
}

main();
