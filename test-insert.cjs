const mysql = require("mysql2/promise");

async function main() {
  const db = mysql.createPool({
    uri: "mysql://root:Denji@2003@localhost:3306/favo",
    connectionLimit: 10,
  });

  try {
    const [result] = await db.query(
      "INSERT INTO inventory (product_id, sku, stock_quantity, low_stock_threshold) VALUES (?, ?, ?, ?)",
      [3, "FAV-TEST-001", 10, 5]
    );
    console.log("Insert success:", result);
  } catch (error) {
    console.error("Insert error:", error);
  } finally {
    await db.end();
  }
}

main();
