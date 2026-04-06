const mysql = require("mysql2/promise");
async function main() {
  const db = mysql.createPool({ uri: "mysql://root:Denji@2003@localhost:3306/favo", connectionLimit: 1 });
  try {
    const [rows] = await db.query(`SHOW CREATE TABLE orders;`);
    console.log(rows[0]['Create Table']);
  } catch (error) { console.error(error); } finally { await db.end(); }
}
main();
