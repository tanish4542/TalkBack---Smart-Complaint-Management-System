const express = require('express');
const router = express.Router();
const db = require('../models/db');

// 1. Submit a new academic complaint
router.post('/new/academics', (req, res) => {
  const { description, isAnonymous, department_id } = req.body;

  const sql = `
    INSERT INTO complaints (description, isAnonymous, department_id, status, created_at)
    VALUES (?, ?, ?, 'pending', NOW())
  `;

  db.query(sql, [description, isAnonymous, department_id], (err, result) => {
    if (err) {
      console.error('Error inserting academic complaint:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'Academic complaint submitted successfully' });
  });
});

// 2. Get academic complaint history
router.get('/history/academics', (req, res) => {
  const sql = `
    SELECT id, description, isAnonymous, department_id, status, created_at
    FROM complaints
    WHERE department_id = 1
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching academic complaints:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// 3. Submit a new administration complaint
router.post('/new/administration', (req, res) => {
  const { description, isAnonymous } = req.body;

  const sql = `
    INSERT INTO complaints (description, isAnonymous, department_id, status, created_at)
    VALUES (?, ?, 2, 'pending', NOW())
  `;

  db.query(sql, [description, isAnonymous], (err, result) => {
    if (err) {
      console.error('Error inserting administration complaint:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json({ message: 'Administration complaint submitted successfully' });
  });
});

// 4. Get administration complaint history
router.get('/history/administration', (req, res) => {
  const sql = `
    SELECT id, description, isAnonymous, department_id, status, created_at
    FROM complaints
    WHERE department_id = 2
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching administration complaints:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});

// 5. Get complaints by department + status
router.get('/:departmentId', (req, res) => {
  const { departmentId } = req.params;
  const { status } = req.query;

  let query = `SELECT * FROM complaints WHERE department_id = ?`;
  let params = [departmentId];

  if (status && status !== 'all') {
    query += ' AND status = ?';
    params.push(status);
  }

  db.query(query, params, (err, results) => {
    if (err) {
      console.error('Error fetching complaints:', err);
      res.status(500).json({ error: 'DB error' });
    } else {
      res.json(results);
    }
  });
});

// 6. Update complaint status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.query(
    'UPDATE complaints SET status = ? WHERE id = ?',
    [status, id],
    (err) => {
      if (err) {
        console.error('Error updating complaint:', err);
        res.status(500).json({ error: 'Update failed' });
      } else {
        res.json({ success: true });
      }
    }
  );
});

module.exports = router;