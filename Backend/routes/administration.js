const express = require('express');
const router = express.Router();
const db = require('../models/db');
const sendEmail = require('../utils/mailer');
const { authorizeRoles } = require('../middleware/authMiddleware');
const complaintService = require('../utils/complaintService');

// POST - Submit Administration Complaint
router.post('/submit', authorizeRoles('student', 'admin', 'principal'), async (req, res) => {
  try {
    const { description, isAnonymous } = req.body;
    const userId = isAnonymous ? null : (req.user?.id || req.body.userId);

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const result = await complaintService.createComplaintRecord({
      userId,
      departmentName: 'Administration',
      description,
      isAnonymous
    });

    // Send confirmation email to user if non-anonymous
    if (!isAnonymous && userId) {
      db.query('SELECT email FROM users WHERE id = ?', [userId], async (err, users) => {
        if (!err && users && users.length > 0) {
          const html = `
            <p>Dear Student,</p>
            <p>Your administration complaint has been received successfully:</p>
            <blockquote>${description}</blockquote>
            <p>Date Submitted: ${new Date().toLocaleString()}</p>
            <p>Thank you for reaching out.</p>
          `;
          try {
            await sendEmail(users[0].email, "📩 Complaint Received - Administration Dept", html);
          } catch (mErr) {
            console.error("Confirmation email note:", mErr.message);
          }
        }
      });
    }

    res.status(200).json({
      message: 'Complaint submitted successfully',
      trackingToken: result.trackingToken
    });
  } catch (err) {
    console.error('Error submitting administration complaint:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET - Fetch administration complaints
router.get('/', authorizeRoles('admin', 'principal', 'student'), async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const isStudent = req.user?.role === 'student';

    const result = await complaintService.getComplaintsPaginated({
      departmentName: 'Administration',
      status,
      page,
      limit,
      isStudentHistory: isStudent,
      userId: req.user?.id
    });

    res.status(200).json(result.data.map(item => ({ ...item, text: item.description })));
  } catch (err) {
    console.error('Error fetching administration complaints:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT - Update status
router.put('/:id/status', authorizeRoles('admin', 'principal'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, version } = req.body;

    if (version === undefined || version === null) {
      return res.status(400).json({ error: 'Version is required' });
    }

    const result = await complaintService.updateComplaintStatusOptimistic({
      complaintId: id,
      newStatus: status,
      changedBy: req.user?.role === 'principal' ? 'Principal' : 'Admin',
      expectedVersion: version
    });

    res.json(result);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

// POST - Response & notify
router.post('/:id/response', authorizeRoles('admin', 'principal'), async (req, res) => {
  try {
    const { id } = req.params;
    const { response, resolvedBy, version } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ error: 'Response is required' });
    }
    if (version === undefined || version === null) {
      return res.status(400).json({ error: 'Version is required' });
    }

    const resolver = resolvedBy || (req.user?.role === 'principal' ? 'Principal' : 'Admin');

    const result = await complaintService.updateComplaintStatusOptimistic({
      complaintId: id,
      newStatus: 'resolved',
      responseText: response,
      changedBy: resolver,
      expectedVersion: version
    });

    // Notify student via email
    db.query(`
      SELECT u.email, c.description, c.is_anonymous
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [id], async (err, rows) => {
      if (!err && rows && rows.length > 0 && !rows[0].is_anonymous && rows[0].email) {
        const html = `
          <p>Hello,</p>
          <p>Your administration complaint:</p>
          <blockquote>${rows[0].description}</blockquote>
          <p>has been <strong>resolved</strong> by ${resolver}.</p>
          <p><strong>Admin Response:</strong> ${response}</p>
          <p>Thank you.</p>
        `;
        try {
          await sendEmail(rows[0].email, "📬 Complaint Resolved - Administration Dept", html);
        } catch (mErr) {
          console.error("Email error note:", mErr.message);
        }
      }
    });

    res.json({ message: 'Response saved and user notified', version: result.version });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;