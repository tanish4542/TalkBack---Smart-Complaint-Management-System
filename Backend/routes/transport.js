const express = require('express');
const router = express.Router();
const db = require('../models/db');
const sendEmail = require('../utils/mailer');

// Student - Submit complaint
router.post('/submit', (req, res) => {
  const { vehicleNumber, type, text, isAnonymous, userId } = req.body;

  const query = `
    INSERT INTO transport_complaints (vehicleNumber, type, text, isAnonymous, user_id, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `;

  db.query(query, [vehicleNumber, type, text, isAnonymous, isAnonymous ? null : userId], (err) => {
    if (err) {
      console.error('Error submitting complaint:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'Complaint submitted successfully' });
  });
});

// Admin/Student - Get complaints with optional status
router.get('/', (req, res) => {
  const { status } = req.query;
  const baseQuery = `
    SELECT tc.*, u.email FROM transport_complaints tc
    LEFT JOIN users u ON tc.user_id = u.id
  `;
  const finalQuery = status && status !== 'all'
    ? `${baseQuery} WHERE tc.status = ? ORDER BY tc.created_at DESC`
    : `${baseQuery} ORDER BY tc.created_at DESC`;

  db.query(finalQuery, status && status !== 'all' ? [status] : [], (err, results) => {
    if (err) {
      console.error('Error fetching transport complaints:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// Admin - Update status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(
    'UPDATE transport_complaints SET status = ? WHERE id = ?',
    [status, id],
    (err) => {
      if (err) {
        console.error('Error updating status:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ message: 'Status updated' });
    }
  );
});

// Admin - Respond and notify
router.post('/:id/response', (req, res) => {
  const { id } = req.params;
  const { response } = req.body;

  const updateQuery = `
    UPDATE transport_complaints
    SET response = ?, status = 'resolved'
    WHERE id = ?
  `;

  db.query(updateQuery, [response, id], (err) => {
    if (err) {
      console.error('Error saving response:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const emailQuery = `
      SELECT u.email, tc.text
      FROM transport_complaints tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.id = ?
    `;

    db.query(emailQuery, [id], async (err2, results) => {
      if (err2) {
        console.error('Error fetching email:', err2);
        return res.status(500).json({ error: 'Failed to fetch email' });
      }

      if (results.length === 0) return res.status(404).json({ error: 'User not found' });

      const { email, text } = results[0];

      const html = `
        <p>Hello,</p>
        <p>Your transportation complaint:</p>
        <blockquote>${text}</blockquote>
        <p>has been resolved.</p>
        <p><strong>Response:</strong> ${response}</p>
        <p>Thank you.</p>
      `;

      try {
        await sendEmail(email, "🚌 Transport Complaint Resolved", html);
        console.log(`Email sent to ${email}`);
      } catch (mailErr) {
        console.error('Failed to send email:', mailErr);
      }

      res.json({ message: 'Response saved and user notified' });
    });
  });
});

// Student - Fetch all complaints (public view)
router.get('/history', (req, res) => {
  const query = `
    SELECT id, vehicleNumber, type, text, response, status, created_at
    FROM transport_complaints
    ORDER BY created_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching transport complaints:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

module.exports = router;