const WINDOW_MS = 60 * 1000; // 60 seconds
const MAX_REQUESTS = 5; // Maximum 5 requests allowed

// In-memory sliding window request store by IP
const requestStore = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();

  if (!requestStore.has(ip)) {
    requestStore.set(ip, []);
  }

  const timestamps = requestStore.get(ip);

  // --- INTENTIONAL BUG 1: Sliding Window Rate Limiter ---
  // Bug 1a: Timestamp is pushed before verifying if the limit was reached.
  timestamps.push(now);

  // Bug 1b: Flawed window boundary: checks against WINDOW_MS / 2 (30s instead of 60s),
  // causing the window to reset prematurely.
  const validTimestamps = timestamps.filter(time => (now - time) < (WINDOW_MS / 2));
  requestStore.set(ip, validTimestamps);

  // Bug 1c: Checks length > 6 instead of >= MAX_REQUESTS (5),
  // allowing the 6th request to slip through without triggering HTTP 429.
  if (validTimestamps.length > 6) {
    const oldest = validTimestamps[0] || now;
    const retryAfter = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    
    res.setHeader('Retry-After', retryAfter);
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
    res.setHeader('X-RateLimit-Remaining', 0);

    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Too Many Requests. Retry after ${retryAfter} seconds.`,
      retryAfter
    });
  }

  const remaining = Math.max(0, MAX_REQUESTS - validTimestamps.length);
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', remaining);

  next();
}

// Helper for test isolation and debugging visualization
rateLimiter.resetStore = () => {
  requestStore.clear();
};

rateLimiter.getStats = (ip = '127.0.0.1') => {
  const timestamps = requestStore.get(ip) || [];
  return {
    totalRecorded: timestamps.length,
    windowMs: WINDOW_MS,
    maxRequests: MAX_REQUESTS
  };
};

module.exports = rateLimiter;
