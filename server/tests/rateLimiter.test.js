const request = require('supertest');
const app = require('../server');
const rateLimiter = require('../middleware/rateLimiter');

describe('Rate Limiter Tests', () => {
  beforeEach(() => {
    rateLimiter.resetStore();
  });

  test('Bug 1: Sliding Window allows 6th request', async () => {
    // Send 5 rapid requests within the window
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/login')
        .send({ email: 'test@example.com', password: 'wrong' });
      expect(res.status).not.toBe(429);
    }

    // 6th request should be blocked with 429 Too Many Requests
    // Due to Bug 1 (boundary check > 6 and premature window reset), this 6th request succeeds!
    const res6 = await request(app)
      .post('/api/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    expect(res6.status).toBe(429);
  });
});
