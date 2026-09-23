const express = require('express');
const router = express.Router();
const db = require('../models/db');
const sendEmail = require('../utils/mailer');
const { authorizeRoles } = require('../middleware/authMiddleware');
const complaintService = require('../utils/complaintService');

// POST - Submit Transport Complaint
router.post('/submit', authorizeRoles('student', 'admin', 'principal'), async (req, res) => {
  try {
    const { vehicleNumber, type, text, description, isAnonymous } = req.body;
    const desc = text || description;
    const userId = isAnonymous ? null : (req.user?.id || req.body.userId);

    if (!desc || !desc.trim()) {
      return res.status(400).json({ error: 'Complaint text is required' });
    }

    const result = await complaintService.createComplaintRecord({
      userId,
      departmentName: 'Transportation',
      description: desc,
      isAnonymous,
      details: { vehicleNumber, type }
    });

    res.status(200).json({
      message: 'Complaint submitted successfully',
      trackingToken: result.trackingToken
    });
  } catch (err) {
    console.error('Error submitting transport complaint:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET - List Transport Complaints
router.get('/', authorizeRoles('admin', 'principal', 'student'), async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const isStudent = req.user?.role === 'student';

    const result = await complaintService.getComplaintsPaginated({
      departmentName: 'Transportation',
      status,
      page,
      limit,
      isStudentHistory: isStudent,
      userId: req.user?.id
    });

    res.status(200).json(result.data.map(item => ({ ...item, text: item.description })));
  } catch (err) {
    console.error('Error fetching transport complaints:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET - Student History
router.get('/history', authorizeRoles('student', 'admin', 'principal'), async (req, res) => {
  try {
    const result = await complaintService.getComplaintsPaginated({
      departmentName: 'Transportation',
      status: 'all',
      page: req.query.page || 1,
      limit: req.query.limit || 50,
      isStudentHistory: true,
      userId: req.user?.id
    });

    res.status(200).json(result.data.map(item => ({ ...item, text: item.description })));
  } catch (err) {
    console.error('Error fetching transport history:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// PUT - Update Status
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

    res.json({ message: 'Status updated', version: result.version });
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
    const { response, version } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ error: 'Response is required' });
    }
    if (version === undefined || version === null) {
      return res.status(400).json({ error: 'Version is required' });
    }

    const resolver = req.user?.role === 'principal' ? 'Principal' : 'Admin';

    const result = await complaintService.updateComplaintStatusOptimistic({
      complaintId: id,
      newStatus: 'resolved',
      responseText: response,
      changedBy: resolver,
      expectedVersion: version
    });

    db.query(`
      SELECT u.email, c.description, c.is_anonymous
      FROM complaints c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [id], async (err, rows) => {
      if (!err && rows && rows.length > 0 && !rows[0].is_anonymous && rows[0].email) {
        const html = `
          <p>Hello,</p>
          <p>Your transportation complaint:</p>
          <blockquote>${rows[0].description}</blockquote>
          <p>has been <strong>resolved</strong>.</p>
          <p><strong>Response:</strong> ${response}</p>
          <p>Thank you.</p>
        `;
        try {
          await sendEmail(rows[0].email, "🚌 Transport Complaint Resolved", html);
        } catch (mErr) {
          console.error("Email error note:", mErr.message);
        }
      }
    });

    res.json({ message: 'Response saved and user notified' });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;