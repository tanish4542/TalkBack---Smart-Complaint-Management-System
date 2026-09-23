const express = require('express');
const router = express.Router();
const db = require('../models/db');
const sendEmail = require('../utils/mailer');
const { authorizeRoles } = require('../middleware/authMiddleware');
const complaintService = require('../utils/complaintService');

// POST - Submit Hostel Complaint
router.post('/submit', authorizeRoles('student', 'admin', 'principal'), async (req, res) => {
  try {
    const { text, description, isAnonymous, hostelBlock, roomNumber } = req.body;
    const desc = text || description;
    const userId = isAnonymous ? null : (req.user?.id || req.body.userId);

    if (!desc || !desc.trim() || !hostelBlock) {
      return res.status(400).json({ error: 'Missing required fields (text, hostelBlock)' });
    }

    const result = await complaintService.createComplaintRecord({
      userId,
      departmentName: 'Hostel',
      description: desc,
      isAnonymous,
      details: { hostelBlock, roomNumber }
    });

    res.status(200).json({
      message: 'Hostel complaint submitted',
      trackingToken: result.trackingToken
    });
  } catch (err) {
    console.error('Error submitting hostel complaint:', err);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// GET - List Hostel Complaints
router.get('/', authorizeRoles('admin', 'principal', 'student'), async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const isStudent = req.user?.role === 'student';

    const result = await complaintService.getComplaintsPaginated({
      departmentName: 'Hostel',
      status,
      page,
      limit,
      isStudentHistory: isStudent,
      userId: req.user?.id
    });

    res.status(200).json(result.data.map(item => ({ ...item, text: item.description })));
  } catch (err) {
    console.error('Error fetching hostel complaints:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

// GET - All history endpoint
router.get('/all', authorizeRoles('student', 'admin', 'principal'), async (req, res) => {
  try {
    const result = await complaintService.getComplaintsPaginated({
      departmentName: 'Hostel',
      status: 'all',
      page: req.query.page || 1,
      limit: req.query.limit || 50,
      isStudentHistory: true,
      userId: req.user?.id
    });

    res.status(200).json(result.data.map(item => ({ ...item, text: item.description, date: item.created_at })));
  } catch (err) {
    console.error('Error fetching hostel history:', err);
    res.status(500).json({ error: 'Failed to fetch complaints' });
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

    res.json({ message: 'Status updated', version: result.version });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ error: 'Failed to update status' });
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
          <p>Your hostel complaint:</p>
          <blockquote>${rows[0].description}</blockquote>
          <p>has been <strong>resolved</strong> by the warden/admin.</p>
          <p><strong>Response:</strong> ${response}</p>
          <p>Thank you.</p>
        `;
        try {
          await sendEmail(rows[0].email, "🏠 Hostel Complaint Resolved", html);
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