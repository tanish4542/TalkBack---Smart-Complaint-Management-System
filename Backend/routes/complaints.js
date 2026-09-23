const express = require('express');
const router = express.Router();
const db = require('../models/db');
const complaintService = require('../utils/complaintService');

// ✅ Anonymous Tracking Token Lookup (Public / Student)
router.post('/track-anonymous', async (req, res) => {
  try {
    const { trackingToken } = req.body;
    if (!trackingToken) {
      return res.status(400).json({ error: 'Tracking token is required' });
    }

    const data = await complaintService.lookupAnonymousComplaint(trackingToken);
    res.status(200).json(data);
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error('Error tracking anonymous complaint:', err);
    res.status(500).json({ error: 'Failed to look up complaint' });
  }
});

// Legacy submit endpoint
router.post('/new/academics', async (req, res) => {
  try {
    const { description, isAnonymous } = req.body;
    const result = await complaintService.createComplaintRecord({
      userId: isAnonymous ? null : (req.user?.id || req.body.user_id),
      departmentName: 'Academics',
      description,
      isAnonymous
    });
    res.status(200).json({ message: 'Academic complaint submitted successfully', trackingToken: result.trackingToken });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Legacy history
router.get('/history/academics', async (req, res) => {
  try {
    const result = await complaintService.getComplaintsPaginated({
      departmentName: 'Academics',
      status: 'all',
      page: 1,
      limit: 50
    });
    res.status(200).json(result.data);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;