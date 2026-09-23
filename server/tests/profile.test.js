const request = require('supertest');
const app = require('../server');
const { generateToken } = require('../utils/jwt');

describe('Profile Authorization Tests', () => {
  test('Bug 3: IDOR profile access', async () => {
    // User 1 (Alex Morgan) is authenticated
    const user1Token = generateToken({
      id: 1,
      name: 'Alex Morgan',
      email: 'alex@example.com',
      role: 'developer'
    });

    // User 1 attempts to access User 2's private profile
    const res = await request(app)
      .get('/api/profile/2')
      .set('Authorization', `Bearer ${user1Token}`);

    // Expected: 403 Forbidden (users can only access their own profile)
    // Due to Bug 3 (Insecure Direct Object Reference), the server returns 200 with User 2's profile!
    expect(res.status).toBe(403);
  });
});
