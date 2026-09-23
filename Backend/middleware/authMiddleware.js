// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized: missing token' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  jwt.verify(token, process.env.JWT_SECRET || 'SCMS_9f3b9d7c4e2a6f8a1d5e7c9b3f1a2d4e', (err, user) => {
    if (err) return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
    req.user = user;
    next();
  });
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: user not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: role '${req.user.role}' is not authorized to access this resource` });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};
