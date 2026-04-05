const mysql = require("mysql2/promise");

async function main() {
  const db = await mysql.createConnection({
    uri: "mysql://root:Denji@2003@localhost:3306/favo",
  });

  try {
    await db.query(`SET FOREIGN_KEY_CHECKS = 0;`);
    console.log("Dropping existing categories table...");
    await db.query(`DROP TABLE IF EXISTS categories;`);
    
    console.log("Creating new categories table...");
    await db.query(`
      CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gender ENUM('Men', 'Women', 'Unisex') NOT NULL,
        category ENUM('Tops', 'Bottoms', 'Dresses', 'Accessories', 'Outerwear', 'Tailoring') NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Inserting new requested categories...");
    
    const newCategories = [
      // Men - Tops
      ['Men', 'Tops', 'T-Shirts'],
      ['Men', 'Tops', 'Shirts (casual)'],
      ['Men', 'Tops', 'Shirts (formal)'],
      ['Men', 'Tops', 'Hoodies & Sweatshirts'],
      ['Men', 'Tops', 'Jackets & Coats'],
      
      // Men - Bottoms
      ['Men', 'Bottoms', 'Pants / Trousers'],
      ['Men', 'Bottoms', 'Jeans'],
      ['Men', 'Bottoms', 'Shorts'],

      // Women - Tops
      ['Women', 'Tops', 'T-Shirts'],
      ['Women', 'Tops', 'Shirts (casual)'],
      ['Women', 'Tops', 'Shirts (formal)'],
      ['Women', 'Tops', 'Hoodies & Sweatshirts'],
      ['Women', 'Tops', 'Jackets & Coats'],

      // Women - Bottoms
      ['Women', 'Bottoms', 'Pants / Trousers'],
      ['Women', 'Bottoms', 'Jeans'],
      ['Women', 'Bottoms', 'Shorts'],
      ['Women', 'Bottoms', 'Skirts'],

      // Women - Dresses
      ['Women', 'Dresses', 'Casual Dresses'],
      ['Women', 'Dresses', 'Party Dresses'],
      ['Women', 'Dresses', 'Maxi Dresses']
    ];

    for (const cat of newCategories) {
      await db.query(`INSERT INTO categories (gender, category, name) VALUES (?, ?, ?)`, cat);
    }
    
    await db.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    console.log("Categories migrated successfully.");
  } catch (error) {
    console.error("Error migrating categories:", error);
  } finally {
    await db.end();
  }
}

main();
