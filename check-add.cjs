const mysql = require("mysql2/promise");
async function main() {
  const db = mysql.createPool({ uri: "mysql://root:Denji@2003@localhost:3306/favo", connectionLimit: 1 });
  try {
    const [ro1] = await db.query(`SHOW CREATE TABLE addresses;`).catch(()=>[[]]);
    console.log(ro1[0] ? ro1[0]['Create Table'] : 'No addresses');
    const [ro2] = await db.query(`SHOW CREATE TABLE order_pickup;`).catch(()=>[[]]);
    console.log(ro2[0] ? ro2[0]['Create Table'] : 'No order_pickup');
  } catch (error) { console.error(error); } finally { await db.end(); }
}
main();
