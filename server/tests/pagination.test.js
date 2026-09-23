const request = require('supertest');
const app = require('../server');
const { generateToken } = require('../utils/jwt');

describe('Pagination Tests', () => {
  test('Bug 5: Pagination skips records', async () => {
    const token = generateToken({ id: 1, email: 'alex@example.com' });

    // Page 2 with limit 10 should return users 11 to 20 (10 users total)
    const res = await request(app)
      .get('/api/users?page=2&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Expected: Exactly 10 records for page 2 (records 11-20)
    // Due to Bug 5 (offset = page * limit = 20), page 2 skips records 11-20 and returns 0 items!
    expect(res.body.users.length).toBe(10);
    expect(res.body.users[0].id).toBe(11);
  });
});
