const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const users = require('../data/users.json');

// GET /api/users?page=1&limit=10&search=
router.get('/', authenticate, (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const search = (req.query.search || '').toLowerCase();

  let filtered = users.map(({ password: _, ...user }) => user);

  if (search) {
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.role.toLowerCase().includes(search)
    );
  }

  // --- INTENTIONAL BUG 5: Pagination Off-by-One ---
  // Offset starts from page * limit instead of (page - 1) * limit.
  // For page 2, offset is 20, causing it to skip records 11–20 completely.
  const offset = page * limit;
  const paginatedUsers = filtered.slice(offset, offset + limit);

  res.json({
    users: paginatedUsers,
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit)
    }
  });
});

module.exports = router;
