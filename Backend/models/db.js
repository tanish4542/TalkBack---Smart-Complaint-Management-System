// models/db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Prachi@1660',
  database: 'complaint_system'
});

db.connect((err) => {
  if (err) {
    console.error('DB Connection Failed:', err);
  } else {
    console.log('Connected to MySQL DB');
  }
});

module.exports = db;