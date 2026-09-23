const express = require('express');
const router = express.Router();
const db = require('../models/db');
const sendEmail = require('../utils/mailer');
const { authorizeRoles } = require('../middleware/authMiddleware');
const complaintService = require('../utils/complaintService');

// POST - Submit Academic Complaint (Student only)
router.post('/submit', authorizeRoles('student', 'admin', 'principal'), async (req, res) => {
  try {
    const { description, course, type, isAnonymous } = req.body;
    const userId = isAnonymous ? null : (req.user?.id || req.body.userId);

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const result = await complaintService.createComplaintRecord({
      userId,
      departmentName: 'Academics',
      description,
      isAnonymous,
      details: { course, type }
    });

    res.status(200).json({
      message: 'Complaint submitted successfully',
      trackingToken: result.trackingToken
    });
  } catch (err) {
    console.error('Error submitting academic complaint:', err);
    res.status(500).json({ error: err.message || 'Database error' });
  }
});

// GET - Admin/Student list (Admin/Principal or Student history)
router.get('/', authorizeRoles('admin', 'principal', 'student'), async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const isStudent = req.user?.role === 'student';

    const result = await complaintService.getComplaintsPaginated({
      departmentName: 'Academics',
      status,
      page,
      limit,
      isStudentHistory: isStudent,
      userId: req.user?.id
    });

    res.status(200).json(result.data);
  } catch (err) {
    console.error('Error fetching academic complaints:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET - Student history explicit route
router.get('/history', authorizeRoles('student', 'admin', 'principal'), async (req, res) => {
  try {
    const result = await complaintService.getComplaintsPaginated({
      departmentName: 'Academics',
      status: 'all',
      page: req.query.page || 1,
      limit: req.query.limit || 50,
      isStudentHistory: true,
      userId: req.user?.id
    });

    res.status(200).json(result.data);
  } catch (err) {
    console.error('Error fetching academic history:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT - Admin: Update Complaint Status (Admin/Principal only)
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
      return res.status(err.statusCode).json({ message: err.message, error: err.message });
    }
    console.error('Error updating academic status:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST - Admin: Submit Response and notify student
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

    // Send email to non-anonymous user if email exists
    db.query(`
      SELECT u.email, c.description, c.is_anonymous
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [id], async (err, rows) => {
      if (!err && rows && rows.length > 0 && !rows[0].is_anonymous && rows[0].email) {
        const html = `
          <p>Hello,</p>
          <p>Your academic complaint:</p>
          <blockquote>${rows[0].description}</blockquote>
          <p>has been <strong>resolved</strong> by ${resolver}.</p>
          <p><strong>Response:</strong> ${response}</p>
          <p>Thank you.</p>
        `;
        try {
          await sendEmail(rows[0].email, "📚 Academic Complaint Resolved", html);
        } catch (mailErr) {
          console.error("Email send note:", mailErr.message);
        }
      }
    });

    res.json({ message: 'Response saved and user notified', version: result.version });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message, error: err.message });
    }
    console.error('Error saving academic response:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;