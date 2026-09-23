const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bugvault-super-secret-key-2024';

function generateToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyToken(token, options = {}) {
  return jwt.verify(token, JWT_SECRET, options);
}

module.exports = {
  JWT_SECRET,
  generateToken,
  verifyToken
};
