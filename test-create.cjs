const { db } = require('./src/lib/db.js'); // Assuming this structure

async function check() {
    try {
        const [rows] = await db.query("DESCRIBE inventory");
        console.log("Schema:", rows);
        const [products] = await db.query("SELECT id, name FROM products LIMIT 5");
        console.log("Products:", products);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
