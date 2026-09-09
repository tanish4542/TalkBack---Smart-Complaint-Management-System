// models/db.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Smile#4542',
  database: process.env.DB_NAME || 'complaint_system',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
});

db.connect((err) => {
  if (err) {
    console.error('DB Connection Failed:', err);
  } else {
    console.log('Connected to MySQL DB');
  }
});

module.exports = db;