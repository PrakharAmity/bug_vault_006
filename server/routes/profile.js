const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const users = require('../data/users.json');

// GET /api/profile - Returns logged-in profile
router.get('/', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// GET /api/profile/:id - Returns profile by ID
router.get('/:id', authenticate, (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === targetId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // --- INTENTIONAL BUG 3: IDOR (Insecure Direct Object Reference) ---
  // The route trusts req.params.id directly and returns any user's profile
  // without verifying whether req.user.id matches targetId.
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

module.exports = router;
