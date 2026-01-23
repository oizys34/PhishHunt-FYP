const mysql = require("mysql2/promise");

const sslCa = process.env.DB_SSL_CA
  ? process.env.DB_SSL_CA.replace(/\\n/g, "\n")
  : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 4000),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,

  // ✅ TLS for TiDB Cloud
  ssl: sslCa
    ? {
        ca: sslCa,
        rejectUnauthorized: true,
      }
    : undefined,
});

module.exports = pool;
