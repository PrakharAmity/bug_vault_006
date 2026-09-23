const { verifyToken } = require('../utils/jwt');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // --- INTENTIONAL BUG 2: JWT Expiration Ignored ---
    // By passing { ignoreExpiration: true }, expired tokens are accepted as valid.
    const decoded = verifyToken(token, { ignoreExpiration: true });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authenticate;
