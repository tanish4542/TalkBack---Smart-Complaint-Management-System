// utils/complaintService.js
const db = require('../models/db');
const crypto = require('crypto');

function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function getDepartmentId(deptName) {
  const rows = await queryAsync('SELECT id FROM departments WHERE LOWER(name) = LOWER(?)', [deptName]);
  if (!rows || rows.length === 0) {
    throw new Error(`Department '${deptName}' not found`);
  }
  return rows[0].id;
}

async function createComplaintRecord({ userId, departmentName, description, isAnonymous, details = {} }) {
  const deptId = await getDepartmentId(departmentName);
  const isAnon = Boolean(isAnonymous);
  let rawToken = null;
  let tokenHash = null;

  if (isAnon) {
    rawToken = crypto.randomBytes(16).toString('hex'); // 32-char hex string
    tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  const effectiveUserId = isAnon ? null : (userId || null);

  const res = await queryAsync(`
    INSERT INTO complaints (user_id, department_id, description, is_anonymous, anonymous_token_hash, status, version)
    VALUES (?, ?, ?, ?, ?, 'pending', 0)
  `, [effectiveUserId, deptId, description, isAnon ? 1 : 0, tokenHash]);

  const complaintId = res.insertId;

  // Insert detail tables if applicable
  const deptLower = departmentName.toLowerCase();
  if (deptLower === 'academics') {
    await queryAsync(`INSERT INTO academic_complaint_details (complaint_id, course, complaint_type) VALUES (?, ?, ?)`, [complaintId, details.course || null, details.type || details.complaint_type || null]);
  } else if (deptLower === 'hostel') {
    await queryAsync(`INSERT INTO hostel_complaint_details (complaint_id, block, room_number) VALUES (?, ?, ?)`, [complaintId, details.hostelBlock || details.block || null, details.roomNumber || details.room_number || null]);
  } else if (deptLower === 'transportation') {
    await queryAsync(`INSERT INTO transport_complaint_details (complaint_id, vehicle_number, issue_type) VALUES (?, ?, ?)`, [complaintId, details.vehicleNumber || details.vehicle_number || null, details.type || details.issueType || null]);
  } else if (deptLower === 'sanitation') {
    await queryAsync(`INSERT INTO sanitation_complaint_details (complaint_id, location, issue_type, urgency) VALUES (?, ?, ?, ?)`, [complaintId, details.location || null, details.issueType || null, details.urgency || 'medium']);
  } else if (deptLower === 'food') {
    await queryAsync(`INSERT INTO food_complaint_details (complaint_id, campus, issue_type) VALUES (?, ?, ?)`, [complaintId, details.campus || null, details.issueType || null]);
  }

  // Record initial status history
  await queryAsync(`
    INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, remarks)
    VALUES (?, ?, ?, ?, ?)
  `, [complaintId, null, 'pending', isAnon ? 'Anonymous Student' : `Student (ID ${effectiveUserId})`, 'Complaint submitted']);

  return { complaintId, trackingToken: rawToken };
}

async function getComplaintsPaginated({ departmentName, status, page = 1, limit = 20, isStudentHistory = false, userId = null }) {
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.max(1, Math.min(100, parseInt(limit) || 20));
  const offset = (p - 1) * l;

  let whereClauses = [];
  let queryParams = [];

  if (departmentName && departmentName !== 'all') {
    const deptId = await getDepartmentId(departmentName);
    whereClauses.push('c.department_id = ?');
    queryParams.push(deptId);
  }

  if (status && status !== 'all') {
    whereClauses.push('c.status = ?');
    queryParams.push(status);
  }

  if (isStudentHistory && userId) {
    whereClauses.push('(c.user_id = ? AND c.is_anonymous = 0)');
    queryParams.push(userId);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) as total FROM complaints c ${whereSql}`;
  const countRes = await queryAsync(countSql, queryParams);
  const totalRecords = countRes[0]?.total || 0;
  const totalPages = Math.ceil(totalRecords / l) || 1;

  const dataSql = `
    SELECT c.id, c.description, c.is_anonymous, c.status, c.response, c.resolved_by, c.version, c.created_at, c.updated_at,
           d.name as department, u.email, u.name as user_name, c.user_id
    FROM complaints c
    JOIN departments d ON c.department_id = d.id
    LEFT JOIN users u ON c.user_id = u.id
    ${whereSql}
    ORDER BY c.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const data = await queryAsync(dataSql, [...queryParams, l, offset]);

  return {
    data,
    pagination: {
      currentPage: p,
      pageSize: l,
      totalRecords,
      totalPages
    }
  };
}

async function updateComplaintStatusOptimistic({ complaintId, newStatus, responseText, changedBy, expectedVersion }) {
  const currentRows = await queryAsync('SELECT * FROM complaints WHERE id = ?', [complaintId]);
  if (!currentRows || currentRows.length === 0) {
    const err = new Error('Complaint not found');
    err.statusCode = 404;
    throw err;
  }

  const complaint = currentRows[0];
  const oldStatus = complaint.status;
  const expVer = Number(expectedVersion ?? complaint.version);

  let updateSql = 'UPDATE complaints SET status = ?, version = version + 1';
  let updateParams = [newStatus];

  if (responseText !== undefined && responseText !== null) {
    updateSql += ', response = ?, resolved_by = ?';
    updateParams.push(responseText, changedBy || 'Admin');
  }

  updateSql += ' WHERE id = ? AND version = ?';
  updateParams.push(complaintId, expVer);

  const res = await queryAsync(updateSql, updateParams);
  if (res.affectedRows === 0) {
    const err = new Error('This complaint was updated by someone else. Please refresh and try again.');
    err.statusCode = 409;
    throw err;
  }

  // Insert status history record
  await queryAsync(`
    INSERT INTO complaint_status_history (complaint_id, old_status, new_status, changed_by, remarks)
    VALUES (?, ?, ?, ?, ?)
  `, [complaintId, oldStatus, newStatus, changedBy || 'Admin', responseText ? `Response: ${responseText}` : `Status set to ${newStatus}`]);

  // Broadcast WebSocket update
  if (global.io) {
    global.io.emit('complaintUpdated', {
      id: Number(complaintId),
      status: newStatus,
      version: expVer + 1
    });
  }

  return { message: 'Status updated successfully', version: expVer + 1, complaintId };
}

async function lookupAnonymousComplaint(rawToken) {
  if (!rawToken || !rawToken.trim()) {
    const err = new Error('Tracking token is required');
    err.statusCode = 400;
    throw err;
  }

  const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');

  const rows = await queryAsync(`
    SELECT c.id, c.description, c.status, c.response, c.resolved_by, c.created_at, d.name as department
    FROM complaints c
    JOIN departments d ON c.department_id = d.id
    WHERE c.anonymous_token_hash = ?
  `, [tokenHash]);

  if (!rows || rows.length === 0) {
    const err = new Error('Invalid tracking token or anonymous complaint not found');
    err.statusCode = 404;
    throw err;
  }

  const complaint = rows[0];
  const history = await queryAsync(`
    SELECT old_status, new_status, changed_by, changed_at, remarks
    FROM complaint_status_history
    WHERE complaint_id = ?
    ORDER BY changed_at ASC
  `, [complaint.id]);

  return {
    complaint: {
      id: complaint.id,
      department: complaint.department,
      description: complaint.description,
      status: complaint.status,
      response: complaint.response,
      resolved_by: complaint.resolved_by,
      created_at: complaint.created_at
    },
    history
  };
}

module.exports = {
  getDepartmentId,
  createComplaintRecord,
  getComplaintsPaginated,
  updateComplaintStatusOptimistic,
  lookupAnonymousComplaint,
  queryAsync
};
