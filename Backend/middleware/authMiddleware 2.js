const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Unauthorized' });

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Forbidden: invalid or expired token' });
    req.user = user;
    next();
  });
}

module.exports = authenticateToken;