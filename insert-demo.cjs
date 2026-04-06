const mysql = require("mysql2/promise");

async function main() {
  const db = mysql.createPool({
    uri: "mysql://root:Denji@2003@localhost:3306/favo",
    connectionLimit: 10,
  });

  try {
    console.log("Inserting demo data into collections...");

    const demoData = [
      {
        title: "Spring Symphony",
        subtitle: "Lighter fabrics for warmer days",
        status: "Published",
        display_order: 1,
        section: "Hero",
        image_url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80"
      },
      {
        title: "The Denim Selection",
        subtitle: "Classic cuts that never fade",
        status: "Published",
        display_order: 2,
        section: "Banner",
        image_url: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=800&q=80"
      },
      {
        title: "Midnight Elegance",
        subtitle: "Evening wear exclusively designed",
        status: "Draft",
        display_order: 3,
        section: "Hero",
        image_url: "https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=800&q=80"
      },
      {
        title: "Urban Street Style",
        subtitle: "Modern aesthetics for the concrete jungle",
        status: "Published",
        display_order: 4,
        section: "Featured",
        image_url: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80"
      }
    ];

    for (const item of demoData) {
      await db.query(
        "INSERT INTO collections (title, subtitle, status, display_order, section, image_url) VALUES (?, ?, ?, ?, ?, ?)",
        [item.title, item.subtitle, item.status, item.display_order, item.section, item.image_url]
      );
    }
    
    console.log("Demo data inserted successfully.");
  } catch (error) {
    console.error("Error inserting demo data:", error);
  } finally {
    await db.end();
  }
}

main();
