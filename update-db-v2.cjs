const mysql = require("mysql2/promise");

async function main() {
  const db = mysql.createPool({
    uri: "mysql://root:Denji@2003@localhost:3306/favo",
    connectionLimit: 10,
  });

  try {
    console.log("Adding section column...");
    await db.query(`ALTER TABLE collections ADD COLUMN section VARCHAR(50) DEFAULT 'Hero' AFTER subtitle;`);
    console.log("Column added successfully.");
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists.");
    } else {
      console.error("Error updating database schema:", error);
    }
  } finally {
    await db.end();
  }
}

main();
