// controllers/complaintController.js
const db = require('../models/db');

exports.createComplaint = (req, res) => {
  const { user_id, department_id, description } = req.body;

  db.query(
    'INSERT INTO complaints (user_id, department_id, description, status) VALUES (?, ?, ?, ?)',
    [user_id, department_id, description, 'Pending'],
    (err, result) => {
      if (err) return res.status(500).json({ message: 'Error submitting complaint', error: err });
      res.status(200).json({ message: 'Complaint submitted successfully' });
    }
  );
};

exports.getComplaints = (req, res) => {
  db.query(`
    SELECT c.id, u.name AS user, d.name AS department, c.description, c.status, c.created_at 
    FROM complaints c 
    JOIN users u ON c.user_id = u.id 
    JOIN departments d ON c.department_id = d.id
  `, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching complaints', error: err });
    res.status(200).json(results);
  });
};