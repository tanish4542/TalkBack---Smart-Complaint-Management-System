require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const db = require('./models/db');

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const academicComplaintsRoute = require("./routes/academiccomplaints");
const administrationComplaintsRoute = require("./routes/administration");
const transportationComplaintsRoute = require("./routes/transport");
const sanitationRoutes = require('./routes/sanitation');
const hostelRoutes = require('./routes/hostel');
const foodRoutes = require('./routes/food');
const principalRoutes = require('./routes/principal');
const authenticateToken = require('./middleware/authMiddleware 2.js');
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

global.io = io;
dotenv.config();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

const addVersionColumnIfMissing = async (tableName) => {
  const query = `ALTER TABLE \`${tableName}\` ADD COLUMN \`version\` INT NOT NULL DEFAULT 0`;
  return new Promise((resolve, reject) => {
    db.query(query, (err, result) => {
      if (err) {
        if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME' || String(err.message).includes('Duplicate column name')) {
          return resolve();
        }
        return reject(err);
      }
      resolve(result);
    });
  });
};

const runEscalationJob = async () => {
  const tables = [
    { table: 'academic_complaints', dateColumn: 'submitted_at' },
    { table: 'administration_complaints', dateColumn: 'submitted_at' },
    { table: 'hostel_complaints', dateColumn: 'submittedAt' },
    { table: 'transport_complaints', dateColumn: 'created_at' },
    { table: 'sanitation_complaints', dateColumn: 'date' },
    { table: 'food_complaints', dateColumn: 'submitted_at' }
  ];

  let totalEscalated = 0;

  for (const { table, dateColumn } of tables) {
    const query = `UPDATE \`${table}\` SET status = 'escalated', version = version + 1 WHERE status = 'pending' AND DATEDIFF(NOW(), ${dateColumn}) > 7`;
    await new Promise((resolve, reject) => {
      db.query(query, (err, result) => {
        if (err) return reject(err);
        totalEscalated += result.affectedRows || 0;
        resolve();
      });
    });
  }

  console.log(`[cron] Escalation job ran. Total complaints escalated: ${totalEscalated}`);
};

const migrateSchema = async () => {
  try {
    const tableNames = [
      'academic_complaints',
      'administration_complaints',
      'hostel_complaints',
      'transport_complaints',
      'sanitation_complaints',
      'food_complaints'
    ];

    for (const tableName of tableNames) {
      await addVersionColumnIfMissing(tableName);
    }

    console.log('[db] version columns ensured for all complaint tables');
  } catch (error) {
    console.error('[db] schema migration failed:', error);
  }
};

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", authenticateToken, complaintRoutes);
app.use("/api/academic", authenticateToken, academicComplaintsRoute);
app.use("/api/administration", authenticateToken, administrationComplaintsRoute);
app.use("/api/transportation", authenticateToken, transportationComplaintsRoute);
app.use('/api/sanitation', authenticateToken, sanitationRoutes);
app.use('/api/hostel', authenticateToken, hostelRoutes);
app.use('/api/food', authenticateToken, foodRoutes);
app.use('/api', authenticateToken, principalRoutes);

const PORT = 3005;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await migrateSchema();
  cron.schedule('0 0 * * *', async () => {
    await runEscalationJob();
  });
  await runEscalationJob();
});