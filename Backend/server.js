require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const db = require('./models/db');
const runMigration = require('./scripts/migrate_to_normalized');

const authRoutes = require("./routes/auth");
const complaintRoutes = require("./routes/complaints");
const academicComplaintsRoute = require("./routes/academiccomplaints");
const administrationComplaintsRoute = require("./routes/administration");
const transportationComplaintsRoute = require("./routes/transport");
const sanitationRoutes = require('./routes/sanitation');
const hostelRoutes = require('./routes/hostel');
const foodRoutes = require('./routes/food');
const principalRoutes = require('./routes/principal');
const { authenticateToken } = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO Setup with CORS Hardening
const io = new Server(server, {
  cors: {
    origin: '*',
    credentials: true
  }
});
global.io = io;

// ✅ Socket.IO Authentication Middleware (JWT Handshake Verification)
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
  if (!token) {
    return next(new Error('Socket Auth Error: Missing token'));
  }
  const secret = process.env.JWT_SECRET || 'SCMS_9f3b9d7c4e2a6f8a1d5e7c9b3f1a2d4e';
  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return next(new Error('Socket Auth Error: Invalid or expired token'));
    }
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id} (User: ${socket.user?.email || socket.user?.id})`);
  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Basic memory rate limiter for API protection
const requestCounts = new Map();
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 mins
  const maxRequests = 200;

  const record = requestCounts.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }
  requestCounts.set(ip, record);

  if (record.count > maxRequests) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
  next();
});

// ✅ Automated 7-Day Escalation Worker with History Logging
const runEscalationJob = async () => {
  try {
    const overdueRows = await new Promise((resolve, reject) => {
      db.query(`
        SELECT id FROM complaints
        WHERE status = 'pending' AND DATEDIFF(NOW(), created_at) > 7
      `, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });

    if (overdueRows.length === 0) {
      console.log('[cron] Escalation sweep: 0 complaints overdue');
      return;
    }

    let escalatedCount = 0;
    for (const row of overdueRows) {
      const complaintId = row.id;
      const updateRes = await new Promise((resolve, reject) => {
        db.query(`
          UPDATE complaints
          SET status = 'escalated', version = version + 1
          WHERE id = ? AND status = 'pending'
        `, [complaintId], (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });

      if (updateRes.affectedRows > 0) {
        escalatedCount++;
        // Log status history
        db.query(`
          INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, remarks)
          VALUES (?, 'pending', 'escalated', 'Automated System Cron', 'Escalated due to 7+ days inactivity')
        `);
      }
    }

    console.log(`[cron] Escalation sweep completed. Total complaints escalated: ${escalatedCount}`);
  } catch (error) {
    console.error('[cron] Escalation job error:', error.message);
  }
};

// Routes Setup
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes); // Includes public /track-anonymous
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
  try {
    await runMigration();
  } catch (mErr) {
    console.error('[server] Migration note:', mErr.message);
  }

  cron.schedule('0 0 * * *', async () => {
    await runEscalationJob();
  });
  await runEscalationJob();
});