const mysql = require("mysql2/promise");

async function main() {
  const db = mysql.createPool({
    uri: "mysql://root:Denji@2003@localhost:3306/favo",
    connectionLimit: 10,
  });

  try {
    const [rows] = await db.query(`DESCRIBE inventory;`);
    console.log("Inventory schema:", rows);

    const [inventoryRows] = await db.query(`SELECT * FROM inventory LIMIT 5;`);
    console.log("Inventory rows:", inventoryRows);
    
    const [productsRows] = await db.query(`SELECT id, name FROM products LIMIT 5;`);
    console.log("Product rows:", productsRows);

  } catch (error) {
    console.error(error);
  } finally {
    await db.end();
  }
}

main();
