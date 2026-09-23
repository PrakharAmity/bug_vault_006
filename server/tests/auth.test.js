const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../server');
const users = require('../data/users.json');
const authRouter = require('../routes/auth');
const rateLimiter = require('../middleware/rateLimiter');
const { JWT_SECRET } = require('../utils/jwt');

describe('Authentication Tests', () => {
  beforeEach(() => {
    rateLimiter.resetStore();
    authRouter.resetAttempts();
  });

  test('Bug 2: JWT expiry ignored', async () => {
    // Generate an expired JWT token (expired 1 hour ago)
    const expiredToken = jwt.sign(
      { id: 1, email: 'alex@example.com', name: 'Alex Morgan' },
      JWT_SECRET,
      { expiresIn: '-1h' }
    );

    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${expiredToken}`);

    // Expected: 401 Unauthorized for expired tokens
    // Due to Bug 2 (ignoreExpiration: true), it returns 200 OK!
    expect(res.status).toBe(401);
  });

  test('Bug 4: Plain text password authentication', async () => {
    const user = users.find(u => u.email === 'alex@example.com');

    // Expected: Passwords must be hashed using bcrypt in users.json
    const isBcryptHashed = typeof user.password === 'string' && /^\$2[aby]\$\d+\$/.test(user.password);
    
    // Due to Bug 4, passwords are stored in plain text ('password123')
    expect(isBcryptHashed).toBe(true);

    // Verify bcrypt comparison succeeds with the proper hash
    const isValid = await bcrypt.compare('password123', user.password);
    expect(isValid).toBe(true);
  });

  test('Bug 6: Login attempt race condition', async () => {
    const targetEmail = 'alex@example.com';

    // Send 6 concurrent failed login requests simultaneously
    const requests = Array.from({ length: 6 }, () =>
      request(app)
        .post('/api/login')
        .send({ email: targetEmail, password: 'wrong_password_test' })
    );

    const responses = await Promise.all(requests);

    // Expected: After 5 failed attempts, the account should be locked (HTTP 423)
    // Due to Bug 6, race condition allows all concurrent requests to read stale count 0
    const lockedResponse = responses.find(r => r.status === 423);
    expect(lockedResponse).toBeDefined();
    expect(lockedResponse && lockedResponse.status).toBe(423);
  });
});
