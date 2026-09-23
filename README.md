# BugVault — Debugging Playground 🛡️

BugVault is a lightweight, self-contained full-stack debugging challenge website intentionally built with **EXACTLY 6 realistic bugs**. It is designed for interview debugging rounds, hackathons, and backend practice.

Developers explore the codebase, observe unexpected behavior in the interactive dashboard, investigate the endpoints and middleware, and write fixes until all tests pass.

---

## Tech Stack

- **Frontend:**
  - React 19
  - Vite
  - Tailwind CSS (Dark Developer Dashboard theme)
  - Axios (with authorization interceptors & rate-limit event bus)
  - React Router DOM
  - Lucide React (Icons)
- **Backend:**
  - Node.js 22
  - Express.js
  - JWT Authentication (`jsonwebtoken`)
  - `bcrypt` (misused in authentication logic)
  - CORS & Helmet
- **Database:**
  - Local JSON database (`server/data/users.json`) with 20 records.
  - 100% offline — zero external database dependencies.
- **Testing:**
  - Jest & Supertest
  - Custom JSON reporter (pure JSON stdout output)

---

## Directory Structure

```
bugvault/
├── challenge.json               # Runtime challenge configuration
├── package.json                 # Unified root orchestration scripts
├── README.md                    # Project documentation
├── scripts/
│   └── dev.js                   # Concurrent development runner
├── client/                      # React 19 Frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.jsx              # App root and client routes
│       ├── main.jsx             # React entry point
│       ├── index.css            # Tailwind directives and styling
│       ├── components/
│       │   ├── Navbar.jsx       # Global navigation and status
│       │   └── RequestCounter.jsx # Sliding Window Timeline visualizer
│       ├── pages/
│       │   ├── Login.jsx        # Login page with rate limit toast
│       │   ├── Dashboard.jsx    # Session metrics & request timeline
│       │   └── Users.jsx        # Paginated users directory & IDOR modal
│       └── services/
│           └── api.js           # Axios API client & rate limit listener
└── server/                      # Express Backend
    ├── server.js                # Server entry point
    ├── jest.config.js           # Jest configuration
    ├── package.json
    ├── data/
    │   └── users.json           # 20 fake user records
    ├── middleware/
    │   ├── auth.js              # JWT verification middleware (Bug 2)
    │   └── rateLimiter.js       # Sliding window rate limiter (Bug 1)
    ├── routes/
    │   ├── auth.js              # Login route (Bug 4, Bug 6)
    │   ├── profile.js           # Profile routes (Bug 3)
    │   └── users.js             # Paginated users route (Bug 5)
    ├── utils/
    │   └── jwt.js               # JWT signing and decode helpers
    └── tests/
        ├── auth.test.js         # Tests for Bug 2, Bug 4, Bug 6
        ├── rateLimiter.test.js  # Tests for Bug 1
        ├── profile.test.js      # Tests for Bug 3
        ├── pagination.test.js   # Tests for Bug 5
        ├── reporter.js          # Custom Jest JSON reporter
        └── run-tests.js         # Pure JSON test execution script
```

---

## Installation Steps

Install all dependencies across the root, client, and server packages:

```bash
# From the root directory:
npm run install:all
```

Or install individually:

```bash
cd server && npm install
cd ../client && npm install
```

---

## How to Run Frontend

To start the Vite frontend development server:

```bash
npm run dev:client
```
The frontend will start at **http://localhost:5173**.

---

## How to Run Backend

To start the Express API server:

```bash
npm run dev:server
```
The backend API will start at **http://localhost:5000**.

To run both frontend and backend concurrently from the root directory:
```bash
npm run dev
```

---

## How to Run Tests

BugVault includes a custom JSON test runner. Running the tests outputs **ONLY JSON** without verbose Jest banners:

```bash
npm test
```

### Expected Initial Output (All 6 Intentional Bugs Failing):

```json
{
  "Bug 1: Sliding Window allows 6th request": {
    "Status": "failed",
    "Execution time": "12ms"
  },
  "Bug 2: JWT expiry ignored": {
    "Status": "failed",
    "Execution time": "8ms"
  },
  "Bug 3: IDOR profile access": {
    "Status": "failed",
    "Execution time": "7ms"
  },
  "Bug 4: Plain text password authentication": {
    "Status": "failed",
    "Execution time": "5ms"
  },
  "Bug 5: Pagination skips records": {
    "Status": "failed",
    "Execution time": "9ms"
  },
  "Bug 6: Login attempt race condition": {
    "Status": "failed",
    "Execution time": "10ms"
  },
  "Total bugs": 6,
  "Passed": 0,
  "Failed": 6,
  "Total Execution time": "51ms"
}
```

The process exits with a non-zero exit code while any bugs remain unfixed. When all bugs are resolved, `Passed` reaches `6`, `Failed` becomes `0`, and the command exits with code `0`.

---

## The 6 Intentional Bugs (Symptoms & Overview)

> [!NOTE]
> The challenge is to identify the root causes in the codebase and fix them until `npm test` reports all 6 bugs as `passed`. Solutions are not listed below.

### Bug 1: Sliding Window allows 6th request
- **Category:** Backend Middleware
- **Difficulty:** Easy
- **File:** `server/middleware/rateLimiter.js`
- **Test:** `server/tests/rateLimiter.test.js`
- **Observed Symptoms:**
  - The rate limiter is configured for a limit of 5 requests per 60 seconds per IP.
  - When sending 6 requests in rapid succession, the 6th request unexpectedly succeeds instead of receiving HTTP 429 (`Too Many Requests`).
  - In addition, the sliding window appears to reset earlier than the configured 60-second window.

### Bug 2: JWT expiry ignored
- **Category:** Authentication
- **Difficulty:** Easy
- **File:** `server/middleware/auth.js`
- **Test:** `server/tests/auth.test.js`
- **Observed Symptoms:**
  - Requests sent with tokens whose expiration timestamp (`exp`) has elapsed are still accepted as valid.
  - The protected endpoint returns HTTP 200 instead of HTTP 401 (`Unauthorized`).

### Bug 3: IDOR profile access
- **Category:** Authorization
- **Difficulty:** Medium
- **Endpoint:** `GET /api/profile/:id`
- **File:** `server/routes/profile.js`
- **Test:** `server/tests/profile.test.js`
- **Observed Symptoms:**
  - An authenticated user (e.g., User ID 1) can supply another user's ID in the URL parameter (e.g., `GET /api/profile/2`) and receive that user's private profile details.
  - The server returns HTTP 200 instead of HTTP 403 (`Forbidden`).

### Bug 4: Plain text password authentication
- **Category:** Authentication
- **Difficulty:** Easy
- **Files:** `server/routes/auth.js`, `server/data/users.json`
- **Test:** `server/tests/auth.test.js`
- **Observed Symptoms:**
  - Inspection of `users.json` reveals user passwords stored as raw, unhashed strings.
  - The login route uses direct string equality (`password === user.password`) rather than verifying bcrypt password hashes with `bcrypt.compare`.

### Bug 5: Pagination skips records
- **Category:** Business Logic
- **Difficulty:** Easy
- **Endpoint:** `GET /api/users?page=2&limit=10`
- **File:** `server/routes/users.js`
- **Test:** `server/tests/pagination.test.js`
- **Observed Symptoms:**
  - Querying page 1 returns records, but querying page 2 (`page=2&limit=10`) on a database of 20 users returns an empty list (`[]`) instead of users 11 through 20.
  - Records 11 through 20 are skipped.

### Bug 6: Login attempt race condition
- **Category:** Concurrency
- **Difficulty:** Medium
- **Endpoint:** `POST /api/login`
- **File:** `server/routes/auth.js`
- **Test:** `server/tests/auth.test.js`
- **Observed Symptoms:**
  - The system is supposed to lock an account after 5 failed login attempts.
  - When multiple failed login requests are sent concurrently, the account fails to lock as expected because requests read stale attempt counts, bypassing the security lockout threshold.

---

## Quick Test Credentials

- **Email:** `alex@example.com`
- **Password:** `password123`
- **User ID:** `1` (Admin)

Additional users can be found in `server/data/users.json`.
#   b u g _ v a u l t _ 0 0 6  
 