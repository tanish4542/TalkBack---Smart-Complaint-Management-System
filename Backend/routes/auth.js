const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require("../utils/mailer");
const crypto = require("crypto");

// ✅ Login Route with Role Validation & 1-Hour JWT Expiration
router.post('/login', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = results[0];

    // 1. Role validation
    if (user.role !== role) {
      return res.status(403).json({ error: `This account does not belong to a ${role}` });
    }

    // 2. Password check
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Wrong password' });

    // 3. Issue JWT with 1-hour expiration
    const secret = process.env.JWT_SECRET || 'SCMS_9f3b9d7c4e2a6f8a1d5e7c9b3f1a2d4e';
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      secret,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, role: user.role, email: user.email }
    });
  });
});

// ✅ Secure Forgot Password Request (Issues Reset Token)
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ message: "Server error" });
    if (!rows || rows.length === 0) return res.status(404).json({ message: "User not found" });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour

    db.query(
      "UPDATE users SET reset_token_hash = ?, reset_token_expires = ? WHERE email = ?",
      [tokenHash, expires, email],
      async (err2) => {
        if (err2) return res.status(500).json({ message: "Failed to set reset token" });

        const resetUrl = `http://localhost:3000/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
        const html = `
          <p>Hello,</p>
          <p>You requested a password reset for your SCMS account.</p>
          <p>Your secure reset token is: <strong>${rawToken}</strong></p>
          <p>Click <a href="${resetUrl}">here to reset your password</a> or use the token in your app.</p>
          <p>This token is valid for 1 hour.</p>
        `;

        try {
          await sendEmail(email, "🔐 Password Reset Token - Complaint System", html);
          res.status(200).json({ message: "Password reset token sent to your email.", resetToken: rawToken });
        } catch (mailErr) {
          res.status(200).json({
            message: "Password reset token generated successfully!",
            resetToken: rawToken
          });
        }
      }
    );
  });
});

// ✅ Reset Password Execution using Token
router.post("/reset-password", (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: "Email, token, and newPassword are required" });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  db.query(
    "SELECT * FROM users WHERE email = ? AND reset_token_hash = ? AND reset_token_expires > NOW()",
    [email, tokenHash],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      if (!rows || rows.length === 0) {
        return res.status(400).json({ error: "Invalid or expired password reset token" });
      }

      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      db.query(
        "UPDATE users SET password = ?, reset_token_hash = NULL, reset_token_expires = NULL WHERE email = ?",
        [hashedPassword, email],
        (err2) => {
          if (err2) return res.status(500).json({ error: "Failed to update password" });
          res.status(200).json({ message: "Password updated successfully. You can now log in." });
        }
      );
    }
  );
});

module.exports = router;