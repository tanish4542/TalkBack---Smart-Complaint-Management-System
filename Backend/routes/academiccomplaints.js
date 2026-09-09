const express = require('express');
const router = express.Router();
const db = require('../models/db'); // MySQL connection
const sendEmail = require('../utils/mailer');

// POST - Submit Academic Complaint
router.post('/submit', (req, res) => {
  const { description, course, type, isAnonymous, userId } = req.body;

  const query = `
    INSERT INTO academic_complaints (description, course, complaint_type, is_anonymous, user_id)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [description, course, type, isAnonymous, isAnonymous ? null : userId],
    (err, result) => {
      if (err) {
        console.error('Error submitting complaint:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json({ message: 'Complaint submitted successfully' });
    }
  );
});

// GET - Admin: Fetch all complaints (optionally filtered by status)
router.get('/', (req, res) => {
  const { status } = req.query;
  const baseQuery = `
    SELECT ac.*, u.email FROM academic_complaints ac
    LEFT JOIN users u ON ac.user_id = u.id
  `;
  const fullQuery = status && status !== 'all'
    ? `${baseQuery} WHERE ac.status = ? ORDER BY submitted_at DESC`
    : `${baseQuery} ORDER BY submitted_at DESC`;

  db.query(fullQuery, status && status !== 'all' ? [status] : [], (err, results) => {
    if (err) {
      console.error('Error fetching complaints:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// PUT - Admin: Update Complaint Status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, version } = req.body;

  if (version === undefined || version === null) {
    return res.status(400).json({ error: 'Version is required' });
  }

  db.query(
    'UPDATE academic_complaints SET status = ?, version = version + 1 WHERE id = ? AND version = ?',
    [status, id, Number(version)],
    (err, result) => {
      if (err) {
        console.error('Error updating status:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(409).json({ message: 'This complaint was updated by someone else. Please refresh and try again.' });
      }

      global.io?.emit('complaintUpdated', { id: Number(id), status, department: 'academic' });
      res.json({ message: 'Status updated successfully', version: Number(version) + 1 });
    }
  );
});
router.post('/:id/response', (req, res) => {
  const { id } = req.params;
  const { response, resolvedBy, version } = req.body;

  if (version === undefined || version === null) {
    return res.status(400).json({ error: 'Version is required' });
  }

  const resolver = resolvedBy || 'Admin';

  const updateQuery = `
    UPDATE academic_complaints
    SET response = ?, status = 'resolved', resolved_by = ?, submitted_at = CURRENT_TIMESTAMP, version = version + 1
    WHERE id = ? AND version = ?
  `;

  db.query(updateQuery, [response, resolver, id, Number(version)], (err, result) => {
    if (err) {
      console.error('Error saving response:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const emailQuery = `
      SELECT u.email, ac.description
      FROM academic_complaints ac
      JOIN users u ON ac.user_id = u.id
      WHERE ac.id = ?
    `;

    db.query(emailQuery, [id], async (err2, results) => {
      if (err2) {
        console.error('Error fetching email:', err2);
        return res.status(500).json({ error: 'Failed to fetch email' });
      }

      if (results.length === 0) return res.status(404).json({ error: 'User not found' });

      const { email, description } = results[0];

      const html = `
        <p>Hello,</p>
        <p>Your academic complaint:</p>
        <blockquote>${description}</blockquote>
        <p>has been resolved by the academic team.</p>
        <p><strong>Response:</strong> ${response}</p>
        <p>Thank you.</p>
      `;

      try {
        await sendEmail(email, "📚 Academic Complaint Resolved", html);
        console.log(`Email sent to ${email}`);
      } catch (mailErr) {
        console.error('Failed to send email:', mailErr);
      }

      res.json({ message: 'Response saved and user notified' });
    });
  });
});
// Student - View academic complaint history
// Student - View academic complaint history
router.get('/history', (req, res) => {
  const query = `
    SELECT ac.id, ac.course, ac.complaint_type, ac.description, ac.response, ac.status, ac.submitted_at, ac.resolved_by, ac.version,
           u.email
    FROM academic_complaints ac
    LEFT JOIN users u ON ac.user_id = u.id
    ORDER BY ac.submitted_at DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching academic complaint history:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

module.exports = router;