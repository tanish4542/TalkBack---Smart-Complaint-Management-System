const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require("../utils/mailer");
const crypto = require("crypto");

// ✅ Login Route with Role Validation
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = results[0];

    // ✅ 1. Check role matches
    if (user.role !== role) {
      return res.status(403).json({ error: `This account does not belong to a ${role}` });
    }

    // ✅ 2. Check password
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Wrong password' });

    // ✅ 3. Generate token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role }
    });
  });
});

// ✅ Forgot Password Route
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const newPassword = crypto.randomBytes(4).toString("hex");
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.promise().query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

    const html = `
      <p>Hello,</p>
      <p>Your new password is: <strong>${newPassword}</strong></p>
      <p>Please log in and change your password immediately.</p>
    `;

    await sendEmail(email, "🔐 Password Reset - Complaint System", html);

    console.log(`Password reset email sent to ${email} with new password: ${newPassword}`);

    res.status(200).json({ message: "New password sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;