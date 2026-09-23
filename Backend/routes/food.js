const express = require('express');
const router = express.Router();
const db = require('../models/db');
const sendEmail = require('../utils/mailer');
const { authorizeRoles } = require('../middleware/authMiddleware');
const complaintService = require('../utils/complaintService');

// POST - Submit Food Complaint
router.post('/submit', authorizeRoles('student', 'admin', 'principal'), async (req, res) => {
  try {
    const { text, description, isAnonymous, campus, issueType } = req.body;
    const desc = text || description;
    const userId = isAnonymous ? null : (req.user?.id || req.body.userId);

    if (!desc || !desc.trim()) {
      return res.status(400).json({ error: 'Complaint text is required' });
    }

    const result = await complaintService.createComplaintRecord({
      userId,
      departmentName: 'Food',
      description: desc,
      isAnonymous,
      details: { campus, issueType }
    });

    res.status(200).json({
      message: 'Complaint submitted successfully',
      trackingToken: result.trackingToken
    });
  } catch (err) {
    console.error('Error submitting food complaint:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET - Fetch Food Complaints
router.get('/', authorizeRoles('admin', 'principal', 'student'), async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const isStudent = req.user?.role === 'student';

    const result = await complaintService.getComplaintsPaginated({
      departmentName: 'Food',
      status,
      page,
      limit,
      isStudentHistory: isStudent,
      userId: req.user?.id
    });

    res.status(200).json(result.data.map(item => ({ ...item, text: item.description })));
  } catch (err) {
    console.error('Error fetching food complaints:', err);
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

// POST - Response
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

    res.json({ message: 'Response submitted', version: result.version });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;