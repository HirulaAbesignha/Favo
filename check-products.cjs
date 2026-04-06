const mysql = require("mysql2/promise");

async function main() {
  const db = mysql.createPool({
    uri: "mysql://root:Denji@2003@localhost:3306/favo",
    connectionLimit: 10,
  });

  try {
    const [rows] = await db.query(`DESCRIBE products;`);
    console.log("Products schema:", rows);

    const [catRows] = await db.query(`DESCRIBE categories;`);
    console.log("Categories schema:", catRows);
  } catch (error) {
    console.error(error);
  } finally {
    await db.end();
  }
}

main();
