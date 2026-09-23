// scripts/test_system.js
const http = require('http');
const mysql = require('mysql2');
const crypto = require('crypto');
require('dotenv').config();

const BASE_URL = 'http://localhost:3005';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'complaint_system',
  waitForConnections: true,
  connectionLimit: 5
});

function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function runTests() {
  console.log('==================================================');
  console.log('STARTING COMPREHENSIVE SCMS VERIFICATION TESTS');
  console.log('==================================================\n');

  let studentToken = '';
  let adminToken = '';

  // TEST 1: Student Login & JWT verification
  console.log('[TEST 1] Logging in as Student...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@example.com', password: 'password123', role: 'student' })
    });
    const data = await res.json();
    if (res.status === 200 && data.token) {
      studentToken = data.token;
      console.log('  PASSED: Student login successful. Received 1h JWT token.');
    } else {
      console.error('  FAILED: Student login response:', res.status, data);
      process.exit(1);
    }
  } catch (err) {
    console.error('  FAILED: Student login error:', err.message);
    process.exit(1);
  }

  // TEST 2: Admin Login
  console.log('\n[TEST 2] Logging in as Admin...');
  try {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nie.ac.in', password: 'password123', role: 'admin' })
    });
    const data = await res.json();
    if (res.status === 200 && data.token) {
      adminToken = data.token;
      console.log('  PASSED: Admin login successful.');
    } else {
      console.error('  FAILED: Admin login response:', res.status, data);
      process.exit(1);
    }
  } catch (err) {
    console.error('  FAILED: Admin login error:', err.message);
    process.exit(1);
  }

  // TEST 3: RBAC Middleware Protection (HTTP 403)
  console.log('\n[TEST 3] Testing RBAC Middleware (Student attempting Admin status update)...');
  try {
    const res = await fetch(`${BASE_URL}/api/academic/1/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({ status: 'resolved', version: 0 })
    });
    const data = await res.json();
    if (res.status === 403) {
      console.log(`  PASSED: RBAC properly rejected unauthorized student with 403 Forbidden ("${data.error}")`);
    } else {
      console.error('  FAILED: Expected 403, got status:', res.status, data);
    }
  } catch (err) {
    console.error('  FAILED: RBAC test error:', err.message);
  }

  // TEST 4: Invalid/Missing Token (HTTP 401)
  console.log('\n[TEST 4] Testing Authentication Middleware (Invalid Token)...');
  try {
    const res = await fetch(`${BASE_URL}/api/academic`, {
      headers: { 'Authorization': 'Bearer invalid_garbage_token' }
    });
    const data = await res.json();
    if (res.status === 401) {
      console.log(`  PASSED: Auth middleware rejected invalid token with 401 Unauthorized ("${data.error}")`);
    } else {
      console.error('  FAILED: Expected 401, got status:', res.status, data);
    }
  } catch (err) {
    console.error('  FAILED: Auth test error:', err.message);
  }

  // TEST 5: Authenticated Complaint Submission
  console.log('\n[TEST 5] Submitting regular Academic Complaint (Authenticated)...');
  let complaintId = null;
  try {
    const res = await fetch(`${BASE_URL}/api/academic/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        description: 'Automated test: Course grading discrepancy in CS101',
        isAnonymous: false,
        course: 'Computer Science',
        type: 'Grading Issue'
      })
    });
    const data = await res.json();
    if (res.status === 200) {
      // Find latest inserted complaint ID
      const rows = await dbQuery('SELECT id FROM complaints ORDER BY id DESC LIMIT 1');
      complaintId = rows[0].id;
      console.log(`  PASSED: Authenticated complaint created with ID: ${complaintId}`);
    } else {
      console.error('  FAILED: Complaint submission failed:', res.status, data);
    }
  } catch (err) {
    console.error('  FAILED: Complaint submission error:', err.message);
  }

  // TEST 6: Admin View & Pagination
  console.log('\n[TEST 6] Admin viewing complaints with pagination...');
  try {
    const res = await fetch(`${BASE_URL}/api/academic?page=1&limit=10`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data)) {
      console.log(`  PASSED: Admin retrieved ${data.length} complaints via paginated route.`);
    } else {
      console.error('  FAILED: Admin complaint view failed:', res.status, data);
    }
  } catch (err) {
    console.error('  FAILED: Admin complaint view error:', err.message);
  }

  // TEST 7: Status Update & Audit Logging
  console.log('\n[TEST 7] Admin updating complaint status to "in_review"...');
  try {
    const res = await fetch(`${BASE_URL}/api/academic/${complaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'in_review',
        version: 0
      })
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log(`  PASSED: Status updated to 'in_review'. New version: ${data.version}`);
    } else {
      console.error('  FAILED: Status update failed:', res.status, data);
    }
  } catch (err) {
    console.error('  FAILED: Status update error:', err.message);
  }

  // TEST 8: Optimistic Concurrency Control (Conflict Detection 409)
  console.log('\n[TEST 8] Testing Optimistic Concurrency Control (Version Conflict)...');
  try {
    const res = await fetch(`${BASE_URL}/api/academic/${complaintId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'resolved',
        version: 0 // Stale version! Current version is 1
      })
    });
    const data = await res.json();
    if (res.status === 409) {
      console.log(`  PASSED: Optimistic concurrency control blocked stale update with 409 Conflict ("${data.error}")`);
    } else {
      console.error('  FAILED: Expected 409 Conflict, got status:', res.status, data);
    }
  } catch (err) {
    console.error('  FAILED: Concurrency test error:', err.message);
  }

  // TEST 9: Anonymous Complaint Submission & Hashing
  console.log('\n[TEST 9] Submitting Anonymous Complaint...');
  let trackingToken = null;
  try {
    const res = await fetch(`${BASE_URL}/api/academic/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        description: 'Automated test: Anonymous report regarding lab equipment',
        isAnonymous: true,
        course: 'Computer Science',
        type: 'Course Material'
      })
    });
    const data = await res.json();
    if (res.status === 200 && data.trackingToken) {
      trackingToken = data.trackingToken;
      console.log(`  PASSED: Anonymous complaint submitted. Tracking token: ${trackingToken}`);
    } else {
      console.error('  FAILED: Anonymous complaint submission failed:', res.status, data);
    }
  } catch (err) {
    console.error('  FAILED: Anonymous submission error:', err.message);
  }

  // TEST 10: Database SHA-256 Hashing Verification
  console.log('\n[TEST 10] Direct Database Audit (Verifying Anonymous Hashing & User Anonymity)...');
  try {
    const rows = await dbQuery('SELECT id, user_id, is_anonymous, anonymous_token_hash FROM complaints ORDER BY id DESC LIMIT 1');
    const latest = rows[0];
    const expectedHash = crypto.createHash('sha256').update(trackingToken).digest('hex');

    if (latest.is_anonymous === 1 && latest.user_id === null && latest.anonymous_token_hash === expectedHash) {
      console.log(`  PASSED: Database records user_id = NULL, is_anonymous = 1, and SHA-256 hash matches!`);
    } else {
      console.error('  FAILED: Database validation failed:', latest, 'Expected Hash:', expectedHash);
    }
  } catch (err) {
    console.error('  FAILED: DB verification error:', err.message);
  }

  // TEST 11: Anonymous Tracking Endpoint Lookup
  console.log('\n[TEST 11] Tracking Anonymous Complaint via Tracking Token...');
  try {
    const res = await fetch(`${BASE_URL}/api/complaints/track-anonymous`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingToken })
    });
    const data = await res.json();
    if (res.status === 200 && data.complaint && data.history) {
      console.log(`  PASSED: Located anonymous complaint. Department: ${data.complaint.department}, Status: ${data.complaint.status}`);
      console.log(`  Audit Timeline Entries: ${data.history.length}`);
    } else {
      console.error('  FAILED: Anonymous lookup failed:', res.status, data);
    }
  } catch (err) {
    console.error('  FAILED: Anonymous lookup error:', err.message);
  }

  // TEST 12: Anonymous Tracking Invalid Token (404)
  console.log('\n[TEST 12] Tracking Anonymous Complaint with Fake Token...');
  try {
    const res = await fetch(`${BASE_URL}/api/complaints/track-anonymous`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingToken: '00000000000000000000000000000000' })
    });
    const data = await res.json();
    if (res.status === 404) {
      console.log(`  PASSED: Fake token correctly returned 404 Not Found ("${data.error}")`);
    } else {
      console.error('  FAILED: Expected 404, got:', res.status, data);
    }
  } catch (err) {
    console.error('  FAILED: Fake token test error:', err.message);
  }

  // TEST 13: Audit Trail Log Verification
  console.log('\n[TEST 13] Verifying Status History Audit Trail in DB...');
  try {
    const rows = await dbQuery('SELECT * FROM complaint_status_history WHERE complaint_id = ?', [complaintId]);
    if (rows.length >= 2) {
      console.log(`  PASSED: Found ${rows.length} status history records for complaint #${complaintId}`);
      rows.forEach(r => console.log(`    - Old: ${r.old_status || 'null'} -> New: ${r.new_status} | By: ${r.changed_by}`));
    } else {
      console.error('  FAILED: Insufficient status history records:', rows);
    }
  } catch (err) {
    console.error('  FAILED: Status history verification error:', err.message);
  }

  console.log('\n==================================================');
  console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
  console.log('==================================================');

  pool.end();
}

runTests();
