import mysql from "mysql2/promise";

const globalForDb = globalThis;

export const db =
  globalForDb.__favoDbPool ||
  mysql.createPool({
    uri: process.env.DATABASE_URL,
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__favoDbPool = db;
}
