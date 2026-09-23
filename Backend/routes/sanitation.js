const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { authorizeRoles } = require('../middleware/authMiddleware');
const complaintService = require('../utils/complaintService');

// POST - Submit Sanitation Complaint
router.post('/submit', authorizeRoles('student', 'admin', 'principal'), async (req, res) => {
  try {
    const { text, description, isAnonymous, location, issueType, urgency } = req.body;
    const desc = text || description;
    const userId = isAnonymous ? null : (req.user?.id || req.body.userId);

    if (!desc || !location || !issueType || !urgency) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await complaintService.createComplaintRecord({
      userId,
      departmentName: 'Sanitation',
      description: desc,
      isAnonymous,
      details: { location, issueType, urgency }
    });

    res.status(200).json({
      message: 'Sanitation complaint submitted successfully',
      trackingToken: result.trackingToken
    });
  } catch (err) {
    console.error('DB Insert error:', err);
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

// GET - List Sanitation Complaints
router.get('/', authorizeRoles('admin', 'principal', 'student'), async (req, res) => {
  try {
    const { status, page, limit } = req.query;
    const isStudent = req.user?.role === 'student';

    const result = await complaintService.getComplaintsPaginated({
      departmentName: 'Sanitation',
      status,
      page,
      limit,
      isStudentHistory: isStudent,
      userId: req.user?.id
    });

    res.json(result.data.map(item => ({
      ...item,
      text: item.description,
      resolvedBy: item.resolved_by,
      date: item.created_at
    })));
  } catch (err) {
    console.error('DB Fetch error:', err);
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

// POST - Save Response
router.post('/:id/response', authorizeRoles('admin', 'principal'), async (req, res) => {
  try {
    const { id } = req.params;
    const { response, version } = req.body;

    if (!response || !response.trim()) {
      return res.status(400).json({ error: 'Response required' });
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

    res.json({ message: 'Response saved and complaint marked as resolved', version: result.version });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    res.status(500).json({ error: 'Failed to save response' });
  }
});

module.exports = router;