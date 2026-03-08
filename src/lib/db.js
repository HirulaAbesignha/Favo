import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is missing in .env.local");
}

export const db = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10,
});