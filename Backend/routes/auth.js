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
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, rows) => {
    if (err) {
      console.error("Forgot password DB error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const newPassword = crypto.randomBytes(4).toString("hex");
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email], async (err2) => {
      if (err2) {
        console.error("Password update error:", err2);
        return res.status(500).json({ message: "Failed to update password" });
      }

      const html = `
        <p>Hello,</p>
        <p>Your new password is: <strong>${newPassword}</strong></p>
        <p>Please log in and change your password immediately.</p>
      `;

      try {
        await sendEmail(email, "🔐 Password Reset - Complaint System", html);
        console.log(`Password reset email sent to ${email} with new password: ${newPassword}`);
        res.status(200).json({ message: "New password sent to your email." });
      } catch (mailErr) {
        console.error("Failed to send reset email via SMTP:", mailErr.message);
        res.status(200).json({ 
          message: `Password reset successfully! Your new password is: ${newPassword}` 
        });
      }
    });
  });
});

module.exports = router;