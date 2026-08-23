const express = require('express');
const router = express.Router();
const db = require('../models/db');
const sendEmail = require('../utils/mailer');

// POST: Submit hostel complaint
router.post('/submit', (req, res) => {
  const { text, isAnonymous, hostelBlock, roomNumber, userId } = req.body;

  if (!text || !hostelBlock) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    INSERT INTO hostel_complaints (text, isAnonymous, block, roomNumber, user_id, status)
    VALUES (?, ?, ?, ?, ?, 'pending')
  `;

  db.query(
    query,
    [text, isAnonymous, hostelBlock, isAnonymous ? null : roomNumber, isAnonymous ? null : userId],
    (err) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: 'Failed to submit complaint' });
      }
      res.status(201).json({ message: 'Hostel complaint submitted' });
    }
  );
});

// GET: Fetch hostel complaints (with optional status)
router.get('/', (req, res) => {
  const { status } = req.query;

  const baseQuery = `
    SELECT hc.id, hc.text, hc.block AS hostelBlock, hc.roomNumber, hc.isAnonymous,
           hc.submittedAt, hc.status, hc.response, hc.version, u.email
    FROM hostel_complaints hc
    LEFT JOIN users u ON hc.user_id = u.id
  `;

  const fullQuery = status && status !== 'all'
    ? `${baseQuery} WHERE hc.status = ? ORDER BY hc.submittedAt DESC`
    : `${baseQuery} ORDER BY hc.submittedAt DESC`;

  db.query(fullQuery, status && status !== 'all' ? [status] : [], (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: 'Failed to fetch complaints' });
    }
    res.json(Array.isArray(results) ? results : []);
  });
});

// PUT: Update complaint status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, version } = req.body;

  if (version === undefined || version === null) {
    return res.status(400).json({ error: 'Version is required' });
  }

  db.query(
    'UPDATE hostel_complaints SET status = ?, version = version + 1 WHERE id = ? AND version = ?',
    [status, id, Number(version)],
    (err, result) => {
      if (err) {
        console.error("Status update error:", err);
        return res.status(500).json({ error: 'Failed to update status' });
      }

      if (result.affectedRows === 0) {
        return res.status(409).json({ message: 'This complaint was updated by someone else. Please refresh and try again.' });
      }

      global.io?.emit('complaintUpdated', { id: Number(id), status, department: 'hostel' });
      res.json({ message: 'Status updated', version: Number(version) + 1 });
    }
  );
});

// POST: Save response and notify student (if not anonymous)
router.post('/:id/response', (req, res) => {
  const { id } = req.params;
  const { response, version } = req.body;

  if (version === undefined || version === null) {
    return res.status(400).json({ error: 'Version is required' });
  }

  const updateQuery = `
    UPDATE hostel_complaints
    SET response = ?, status = 'resolved', version = version + 1
    WHERE id = ? AND version = ?
  `;

  db.query(updateQuery, [response, id, Number(version)], (err, result) => {
    if (err) {
      console.error('Error saving response:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const emailQuery = `
      SELECT u.email, hc.text, hc.isAnonymous
      FROM hostel_complaints hc
      LEFT JOIN users u ON hc.user_id = u.id
      WHERE hc.id = ?
    `;

    db.query(emailQuery, [id], async (err2, results) => {
      if (err2) {
        console.error('Error fetching email:', err2);
        return res.status(500).json({ error: 'Failed to fetch email' });
      }

      if (results.length === 0) {
        return res.status(200).json({ message: 'Response saved, but no user found for email' });
      }

      const { email, text, isAnonymous } = results[0];

      // Skip email if anonymous or email is null
      if (isAnonymous || !email) {
        return res.status(200).json({ message: 'Response saved, no email sent (anonymous or no email)' });
      }

      const html = `
        <p>Hello,</p>
        <p>Your hostel complaint:</p>
        <blockquote>${text}</blockquote>
        <p>has been resolved by the warden.</p>
        <p><strong>Response:</strong> ${response}</p>
        <p>Thank you.</p>
      `;

      try {
        await sendEmail(email, "🏠 Hostel Complaint Resolved", html);
        console.log(`Email sent to ${email}`);
      } catch (mailErr) {
        console.error('Failed to send email:', mailErr);
      }

      res.json({ message: 'Response saved and user notified' });
    });
  });
});

module.exports = router;

// GET: Fetch all hostel complaints for student portal
router.get('/all', (req, res) => {
  const sql = `
    SELECT id, block AS hostelBlock, roomNumber, text, isAnonymous, submittedAt AS date, status, response, version
    FROM hostel_complaints
    ORDER BY submittedAt DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ error: 'Failed to fetch complaints' });
    }
    res.status(200).json(results);
  });
});