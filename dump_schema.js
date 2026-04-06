const pool = require("./src/lib/backend/db");

async function dump() {
    try {
        const [tables] = await pool.query("SHOW TABLES");
        console.log("Tables:");
        console.log(tables);

        for (let row of tables) {
            const tableName = Object.values(row)[0];
            const [columns] = await pool.query(`DESCRIBE ${tableName}`);
            console.log(`\nTable: ${tableName}`);
            console.log(columns.map(c => `${c.Field} (${c.Type})`).join(", "));
        }
    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

dump();
