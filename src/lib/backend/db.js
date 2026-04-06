const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Shasrika2005",
  database: "favo",
});

module.exports = pool;