const express = require('express');
const router = express.Router();
const db = require('../models/db'); // DB connection
const sendEmail = require('../utils/mailer');

// =============================
// Student side: Submit complaint
// =============================
router.post('/submit', (req, res) => {
  const { description, isAnonymous, userId } = req.body;

  const query = `
    INSERT INTO administration_complaints (text, is_anonymous, user_id, status, submitted_at)
    VALUES (?, ?, ?, 'Pending', NOW())
  `;

  db.query(
    query,
    [description, isAnonymous, isAnonymous ? null : userId],
    (err, result) => {
      if (err) {
        console.error('Error submitting complaint:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Send confirmation email to user if not anonymous
      if (!isAnonymous && userId) {
        db.query('SELECT email FROM users WHERE id = ?', [userId], async (err2, users) => {
          if (err2) {
            console.error('Error fetching user email for confirmation:', err2);
          } else if (users.length > 0) {
            const email = users[0].email;
            const html = `
              <p>Dear Student,</p>
              <p>Your administration complaint has been received successfully with the following details:</p>
              <blockquote>${description}</blockquote>
              <p><strong>Date Submitted:</strong> ${new Date().toLocaleString()}</p>
              <p>Thank you for reaching out. We will get back to you soon.</p>
            `;
            try {
              await sendEmail(email, "📩 Complaint Received - Administration Dept", html);
              console.log(`Confirmation email sent to ${email}`);
            } catch (mailErr) {
              console.error("Failed to send confirmation email:", mailErr);
            }
          }
        });
      }

      res.status(200).json({ message: 'Complaint submitted successfully' });
    }
  );
});

// =============================
// Student/Admin side: Get complaints with optional status filter
// =============================
router.get('/', (req, res) => {
  const { status } = req.query;
  const baseQuery = `
    SELECT ac.*, u.email FROM administration_complaints ac
    LEFT JOIN users u ON ac.user_id = u.id
  `;
  const fullQuery = status && status !== 'all' ? `${baseQuery} WHERE ac.status = ? ORDER BY submitted_at DESC` : `${baseQuery} ORDER BY submitted_at DESC`;

  db.query(fullQuery, status && status !== 'all' ? [status] : [], (err, results) => {
    if (err) {
      console.error('Error fetching complaints:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// =============================
// Admin side: Update complaint status
// =============================
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, version } = req.body;

  if (version === undefined || version === null) {
    return res.status(400).json({ error: 'Version is required' });
  }

  db.query(
    'UPDATE administration_complaints SET status = ?, version = version + 1 WHERE id = ? AND version = ?',
    [status, id, Number(version)],
    (err, result) => {
      if (err) {
        console.error('Error updating status:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(409).json({ message: 'This complaint was updated by someone else. Please refresh and try again.' });
      }

      global.io?.emit('complaintUpdated', { id: Number(id), status, department: 'administration' });
      res.json({ message: 'Status updated successfully', version: Number(version) + 1 });
    }
  );
});

// =============================
// Admin side: Submit a response and notify student
// =============================
router.post('/:id/response', (req, res) => {
  const { id } = req.params;
  const { response, resolvedBy, version } = req.body;

  if (version === undefined || version === null) {
    return res.status(400).json({ error: 'Version is required' });
  }

  const updateQuery = `
    UPDATE administration_complaints
    SET response = ?, resolved_by = ?, status = 'Resolved', updated_at = CURRENT_TIMESTAMP, version = version + 1
    WHERE id = ? AND version = ?
  `;

  db.query(updateQuery, [response, resolvedBy, id, Number(version)], (err, result) => {
    if (err) {
      console.error('Error saving response:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    // Get user's email and complaint text
    const userEmailQuery = `
      SELECT u.email, ac.text
      FROM administration_complaints ac
      JOIN users u ON ac.user_id = u.id
      WHERE ac.id = ?
    `;

    db.query(userEmailQuery, [id], async (err2, results) => {
      if (err2) {
        console.error('Error fetching user email:', err2);
        return res.status(500).json({ error: 'Failed to retrieve user email' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'User email not found' });
      }

      const { email, text } = results[0];

      const html = `
        <p>Hello,</p>
        <p>Your administration complaint:</p>
        <blockquote>${text}</blockquote>
        <p>has been <strong>resolved</strong> by the admin.</p>
        <p><strong>Admin Response:</strong> ${response}</p>
        <p>Thank you.</p>
      `;

      try {
        await sendEmail(email, "📬 Complaint Resolved - Administration Dept", html);
        console.log(`Mail sent to ${email}`);
      } catch (mailErr) {
        console.error("Failed to send email:", mailErr);
      }

      res.json({ message: 'Response saved and user notified' });
    });
  });
});

module.exports = router;