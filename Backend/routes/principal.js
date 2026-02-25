const express = require('express');
const router = express.Router();
const db = require('../models/db');

const departmentTables = [
  { table: 'academic_complaints', department: 'Academics', textColumn: 'description', submittedColumn: 'submitted_at', responseCol: 'response' },
  { table: 'administration_complaints', department: 'Administration', textColumn: 'text', submittedColumn: 'submitted_at', responseCol: 'response' },
  { table: 'hostel_complaints', department: 'Hostel', textColumn: 'text', submittedColumn: 'submittedAt', responseCol: 'response' },
  { table: 'transport_complaints', department: 'Transportation', textColumn: 'text', submittedColumn: 'created_at', responseCol: 'response' },
  { table: 'sanitation_complaints', department: 'Sanitation', textColumn: 'text', submittedColumn: 'date', responseCol: 'resolvedBy' },
  { table: 'food_complaints', department: 'Food', textColumn: 'text', submittedColumn: 'submitted_at', responseCol: 'response' },
];

// Helper for promisified query
function dbQuery(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

// Fetch pending complaints
router.get('/principal/pending', async (req, res) => {
  const status = req.query.status || 'pending';

  try {
    const results = await Promise.all(
      departmentTables.map(({ table, department, textColumn, submittedColumn, responseCol }) => {
        const query = `
          SELECT id, ${textColumn} AS text, ${submittedColumn} AS submitted_at, ${responseCol} AS response, status, ? AS department
          FROM ${table}
          WHERE status = ?
        `;
        return dbQuery(query, [department, status]);
      })
    );

    const merged = results.flat().sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    res.json(merged);
  } catch (error) {
    console.error("Error fetching principal complaints:", error);
    res.status(500).json({ error: "Failed to fetch complaints" });
  }
});

// Fetch resolved complaints
router.get('/principal/resolved', async (req, res) => {
  try {
    const results = await Promise.all(
      departmentTables.map(({ table, department, textColumn, submittedColumn, responseCol }) => {
        const query = `
          SELECT id, ${textColumn} AS text, ${submittedColumn} AS submitted_at, ${responseCol} AS response, status, ? AS department
          FROM ${table}
          WHERE status = 'resolved'
        `;
        return dbQuery(query, [department]);
      })
    );

    const merged = results.flat().sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    res.json(merged);
  } catch (error) {
    console.error("Error fetching resolved complaints:", error);
    res.status(500).json({ error: "Failed to fetch resolved complaints" });
  }
});

// Fetch urgent complaints (older than 7 days)
router.get('/principal/urgent', async (req, res) => {
  try {
    const results = await Promise.all(
      departmentTables.map(({ table, department, textColumn, submittedColumn, responseCol }) => {
        const query = `
          SELECT id, ${textColumn} AS text, ${submittedColumn} AS submitted_at, ${responseCol} AS response, status, ? AS department
          FROM ${table}
          WHERE status = 'pending' AND DATEDIFF(NOW(), ${submittedColumn}) > 7
        `;
        return dbQuery(query, [department]);
      })
    );

    const merged = results.flat().sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    res.json(merged);
  } catch (error) {
    console.error("Error fetching urgent complaints:", error);
    res.status(500).json({ error: "Failed to fetch urgent complaints" });
  }
});

// Submit principal response
router.post('/:id/principal-response', async (req, res) => {
  const { id } = req.params;
  const { response, resolvedBy, department } = req.body;

  if (!response || !department) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const tableMeta = departmentTables.find(d => d.department.toLowerCase() === department.toLowerCase());

  if (!tableMeta) {
    return res.status(400).json({ error: "Invalid department" });
  }

  const { table, responseCol } = tableMeta;

  try {
    const query = `
      UPDATE ${table}
      SET ${responseCol} = ?, resolved_by = ?, status = 'resolved'
      WHERE id = ?
    `;
    db.query(query, [response.trim(), resolvedBy || 'Principal', id], (err) => {
      if (err) {
        console.error("Error updating complaint:", err);
        return res.status(500).json({ error: "Failed to submit principal response" });
      }
      res.status(200).json({ message: "Principal response submitted" });
    });
  } catch (err) {
    console.error("Error submitting principal response:", err);
    res.status(500).json({ error: "Failed to submit principal response" });
  }
});

router.get('/principal/home', async (req, res) => {
  try {
    const results = await Promise.all(
      departmentTables.map(({ table, submittedColumn }) => {
        const query = `
          SELECT
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved,
            SUM(CASE WHEN status = 'pending' AND DATEDIFF(NOW(), ${submittedColumn}) > 7 THEN 1 ELSE 0 END) AS urgent
          FROM ${table}
        `;
        return dbQuery(query, []); // pass empty params
      })
    );

    // Aggregate totals
    let total = { pending: 0, resolved: 0, urgent: 0 };
    results.forEach(row => {
      if (row[0]) {
        total.pending += Number(row[0].pending) || 0;
        total.resolved += Number(row[0].resolved) || 0;
        total.urgent += Number(row[0].urgent) || 0;
      }
    });

    res.json(total);
  } catch (error) {
    console.error("Error fetching principal home counts:", error);
    res.status(500).json({ error: "Failed to fetch dashboard counts" });
  }
});
module.exports = router;