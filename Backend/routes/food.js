const express = require('express');
const router = express.Router();
const db = require('../models/db');
const sendEmail = require('../utils/mailer');

// Submit food complaint
router.post('/submit', (req, res) => {
  const { text, isAnonymous, userId, campus, issueType } = req.body;

  const query = `
    INSERT INTO food_complaints (text, is_anonymous, user_id, campus, issueType, status)
    VALUES (?, ?, ?, ?, ?, 'Pending')
  `;

  db.query(query, [text, isAnonymous, userId, campus, issueType], (err) => {
    if (err) {
      console.error('Error submitting food complaint:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'Complaint submitted successfully' });
  });
});

// Get food complaints (filtered by status)
router.get('/', (req, res) => {
  const { status } = req.query;
  const baseQuery = `
    SELECT fc.*, u.email FROM food_complaints fc
    LEFT JOIN users u ON fc.user_id = u.id
  `;
  const fullQuery = status && status !== 'all'
    ? `${baseQuery} WHERE fc.status = ? ORDER BY submitted_at DESC`
    : `${baseQuery} ORDER BY submitted_at DESC`;

  db.query(fullQuery, status && status !== 'all' ? [status] : [], (err, results) => {
    if (err) {
      console.error('Error fetching food complaints:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// Update status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, version } = req.body;

  if (version === undefined || version === null) {
    return res.status(400).json({ error: 'Version is required' });
  }

  db.query(
    'UPDATE food_complaints SET status = ?, version = version + 1 WHERE id = ? AND version = ?',
    [status, id, Number(version)],
    (err, result) => {
      if (err) {
        console.error('Error updating status:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(409).json({ message: 'This complaint was updated by someone else. Please refresh and try again.' });
      }

      global.io?.emit('complaintUpdated', { id: Number(id), status, department: 'food' });
      res.json({ message: 'Status updated successfully', version: Number(version) + 1 });
    }
  );
});

// Admin Response
router.post('/:id/response', (req, res) => {
  const { id } = req.params;
  const { response, version } = req.body;

  if (version === undefined || version === null) {
    return res.status(400).json({ error: 'Version is required' });
  }

  db.query(
    `UPDATE food_complaints SET response = ?, status = 'Resolved', version = version + 1 WHERE id = ? AND version = ?`,
    [response, id, Number(version)],
    (err, result) => {
      if (err) {
        console.error('Error saving response:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(409).json({ message: 'This complaint was updated by someone else. Please refresh and try again.' });
      }

      global.io?.emit('complaintUpdated', { id: Number(id), status: 'resolved', department: 'food' });
      res.json({ message: 'Response submitted', version: Number(version) + 1 });
    }
  );
});

module.exports = router;