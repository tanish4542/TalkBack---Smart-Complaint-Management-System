const express = require('express');
const router = express.Router();
const db = require('../models/db');

// POST: Submit sanitation complaint
router.post('/submit', async (req, res) => {
  const { text, isAnonymous, location, issueType, urgency } = req.body;

  if (!text || !location || !issueType || !urgency) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await db.execute(
      `INSERT INTO sanitation_complaints (text, isAnonymous, location, issueType, urgency, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [text, isAnonymous, location, issueType, urgency]
    );
    res.status(201).json({ message: 'Sanitation complaint submitted successfully' });
  } catch (err) {
    console.error('DB Insert error:', err);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// GET: Fetch all or filtered by status
router.get('/', (req, res) => {
  const { status } = req.query;

  let query = `SELECT * FROM sanitation_complaints`;
  const params = [];

  if (status && status !== 'all') {
    query += ` WHERE status = ?`;
    params.push(status);
  }

  query += ` ORDER BY date DESC`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('DB Fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch complaints' });
    }
    res.json(results);
  });
});

// PUT: Update complaint status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(
    `UPDATE sanitation_complaints SET status = ? WHERE id = ?`,
    [status, id],
    (err) => {
      if (err) {
        console.error('Status update error:', err);
        return res.status(500).json({ error: 'Failed to update status' });
      }
      res.json({ message: 'Status updated' });
    }
  );
});

// POST: Save response (in `resolvedBy`)
router.post('/:id/response', (req, res) => {
  const { id } = req.params;
  const { response } = req.body;

  if (!response) {
    return res.status(400).json({ error: 'Response required' });
  }

  db.query(
    `UPDATE sanitation_complaints SET resolvedBy = ?, status = 'resolved' WHERE id = ?`,
    [response, id],
    (err) => {
      if (err) {
        console.error('Response save error:', err);
        return res.status(500).json({ error: 'Failed to save response' });
      }
      res.json({ message: 'Response saved and complaint marked as resolved' });
    }
  );
});

module.exports = router;