const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const users = require('../data/users.json');
const { generateToken } = require('../utils/jwt');
const rateLimiter = require('../middleware/rateLimiter');

// Failed login attempts tracker for account lockouts
const failedAttempts = new Map();

router.post('/login', rateLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

  // Check if account is locked
  const currentAttempts = failedAttempts.get(email.toLowerCase()) || 0;
  if (currentAttempts >= 5) {
    return res.status(423).json({ error: 'Account locked due to too many failed attempts' });
  }

  if (!user) {
    // --- INTENTIONAL BUG 6: Race condition on failed login attempt counter ---
    // Non-atomic read, delayed execution, and stale write
    await new Promise(resolve => setTimeout(resolve, 30));
    failedAttempts.set(email.toLowerCase(), currentAttempts + 1);
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // --- INTENTIONAL BUG 4: Plain text password authentication ---
  // Passwords are stored in plain text and compared with direct equality
  // instead of using bcrypt.compare(password, user.password).
  if (user.password !== password) {
    // --- INTENTIONAL BUG 6: Race condition on failed login attempt counter ---
    await new Promise(resolve => setTimeout(resolve, 30));
    failedAttempts.set(email.toLowerCase(), currentAttempts + 1);
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Reset failed attempts on successful login
  failedAttempts.delete(email.toLowerCase());

  const token = generateToken({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  const { password: _, ...safeUser } = user;

  res.json({
    token,
    user: safeUser
  });
});

// Seed passwords lookup for demo/testing display
const SEED_PASSWORDS = {
  1: "password123",
  2: "terminator2024",
  3: "davidsecurepass",
  4: "elenapassword99",
  5: "wilsonPass!45",
  6: "mayasecret2024",
  7: "vancecodebase1",
  8: "berlinBerlin#8",
  9: "marcuswright44",
  10: "shieldDaisy#10",
  11: "tokyocoding2024",
  12: "liviataylor99!",
  13: "andersondistrib2",
  14: "casablancadev7",
  15: "brooksvalley2024",
  16: "algorithmQueen3",
  17: "cloudengineer#17",
  18: "dakarSystem2024",
  19: "riofullstack88",
  20: "batcaveSecurity1"
};

// GET /api/seed-credentials - Returns seed accounts for playground testing
router.get('/seed-credentials', (req, res) => {
  const credentials = users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    password: typeof u.password === 'string' && u.password.startsWith('$2')
      ? (SEED_PASSWORDS[u.id] || 'password123')
      : u.password,
    role: u.role
  }));

  res.json({
    total: credentials.length,
    credentials
  });
});

// Helper for test cleanup
router.resetAttempts = () => {
  failedAttempts.clear();
};

module.exports = router;
