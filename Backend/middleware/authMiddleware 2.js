// Safe re-export wrapper for authMiddleware.js
const { authenticateToken } = require('./authMiddleware');
module.exports = authenticateToken;