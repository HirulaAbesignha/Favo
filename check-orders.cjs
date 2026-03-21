const mysql = require("mysql2/promise");

async function main() {
  const db = mysql.createPool({
    uri: "mysql://root:Denji@2003@localhost:3306/favo",
    connectionLimit: 10,
  });

  try {
    const [orders] = await db.query(`DESCRIBE orders;`).catch(() => [null]);
    console.log("Orders schema:", orders || "Table 'orders' does not exist");

    const [orderItems] = await db.query(`DESCRIBE order_items;`).catch(() => [null]);
    console.log("Order items schema:", orderItems || "Table 'order_items' does not exist");
  } catch (error) {
    console.error(error);
  } finally {
    await db.end();
  }
}

main();
