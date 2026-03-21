const mysql = require("mysql2/promise");

async function main() {
  const db = mysql.createPool({
    uri: "mysql://root:Denji@2003@localhost:3306/favo",
    connectionLimit: 10,
  });

  try {
    console.log("Dropping existing collections table if it exists...");
    await db.query(`DROP TABLE IF EXISTS collections;`);
    
    console.log("Creating new collections table...");
    await db.query(`
      CREATE TABLE collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(120) NOT NULL,
        subtitle TEXT,
        status VARCHAR(20) DEFAULT 'Draft',
        display_order INT DEFAULT 1,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Table created successfully.");
  } catch (error) {
    console.error("Error updating database schema:", error);
  } finally {
    await db.end();
  }
}

main();
