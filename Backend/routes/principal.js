const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authorizeRoles } = require('../middleware/authMiddleware');
const complaintService = require('../utils/complaintService');

// Fetch pending complaints for Principal
router.get('/principal/pending', authorizeRoles('principal', 'admin'), async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const page = req.query.page || 1;
    const limit = req.query.limit || 50;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const sql = `
      SELECT c.id, c.description AS text, c.created_at AS submitted_at, c.response, c.status, c.version, d.name AS department
      FROM complaints c
      JOIN departments d ON c.department_id = d.id
      WHERE c.status = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(sql, [status, parseInt(limit), offset], (err, results) => {
      if (err) {
        console.error("Error fetching principal pending complaints:", err);
        return res.status(500).json({ error: "Failed to fetch complaints" });
      }
      res.json(results || []);
    });
  } catch (error) {
    console.error("Error fetching principal pending complaints:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// Fetch resolved complaints for Principal
router.get('/principal/resolved', authorizeRoles('principal', 'admin'), async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 50;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const sql = `
      SELECT c.id, c.description AS text, c.created_at AS submitted_at, c.response, c.status, c.version, d.name AS department
      FROM complaints c
      JOIN departments d ON c.department_id = d.id
      WHERE c.status = 'resolved'
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(sql, [parseInt(limit), offset], (err, results) => {
      if (err) {
        console.error("Error fetching principal resolved complaints:", err);
        return res.status(500).json({ error: "Failed to fetch resolved complaints" });
      }
      res.json(results || []);
    });
  } catch (error) {
    console.error("Error fetching resolved complaints:", error);
    res.status(500).json({ error: "Failed to fetch resolved complaints" });
  }
});

// Fetch urgent/escalated complaints (> 7 days)
router.get('/principal/urgent', authorizeRoles('principal', 'admin'), async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 50;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    const sql = `
      SELECT c.id, c.description AS text, c.created_at AS submitted_at, c.response, c.status, c.version, d.name AS department
      FROM complaints c
      JOIN departments d ON c.department_id = d.id
      WHERE c.status = 'escalated' AND DATEDIFF(NOW(), c.created_at) > 7
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(sql, [parseInt(limit), offset], (err, results) => {
      if (err) {
        console.error("Error fetching urgent complaints:", err);
        return res.status(500).json({ error: "Failed to fetch urgent complaints" });
      }
      res.json(results || []);
    });
  } catch (error) {
    console.error("Error fetching urgent complaints:", error);
    res.status(500).json({ error: "Failed to fetch urgent complaints" });
  }
});

// Submit Principal response
router.post('/:id/principal-response', authorizeRoles('principal'), async (req, res) => {
  try {
    const { id } = req.params;
    const { response, resolvedBy, version } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await complaintService.updateComplaintStatusOptimistic({
      complaintId: id,
      newStatus: 'resolved',
      responseText: response,
      changedBy: resolvedBy || 'Principal',
      expectedVersion: version
    });

    res.status(200).json({ message: "Principal response submitted", version: result.version });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("Error submitting principal response:", err);
    res.status(500).json({ error: "Failed to submit principal response" });
  }
});

// Principal Dashboard Summary Counts
router.get('/principal/home', authorizeRoles('principal', 'admin'), async (req, res) => {
  try {
    const sql = `
      SELECT
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved,
        SUM(CASE WHEN status = 'escalated' AND DATEDIFF(NOW(), created_at) > 7 THEN 1 ELSE 0 END) AS urgent
      FROM complaints
    `;

    db.query(sql, (err, rows) => {
      if (err) {
        console.error("Error fetching principal home counts:", err);
        return res.status(500).json({ error: "Failed to fetch dashboard counts" });
      }

      const total = {
        pending: Number(rows[0]?.pending) || 0,
        resolved: Number(rows[0]?.resolved) || 0,
        urgent: Number(rows[0]?.urgent) || 0
      };

      res.json(total);
    });
  } catch (error) {
    console.error("Error fetching principal home counts:", error);
    res.status(500).json({ error: "Failed to fetch dashboard counts" });
  }
});

module.exports = router;