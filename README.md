# BugVault — Developer Security & API Playground

BugVault is an interactive full-stack debugging platform and security testing dashboard designed for developers, interview debugging rounds, and backend engineering practice. It allows developers to explore realistic API behaviors, monitor sliding window rate limiting, inspect session authentication and JWT lifecycles, and diagnose access control vulnerabilities.

---

## 1. Application Overview

### Core Functionality
- **Session Authentication & Security Gateway**: Secure user login with JWT tokens, credential validation, and brute-force protection.
- **Sliding Window Rate Limiter**: Configurable IP-based rate limiting to prevent API abuse, displaying real-time countdowns and remaining request quotas.
- **User Directory & Pagination**: Browse system users with search filtering, multi-page pagination, and limit controls.
- **Profile Authorization & Inspection**: View user profile details with role permissions and token claim validation.
- **Seed Credentials Vault & Quick Testing**: Integrated test credentials explorer providing all 20 seed accounts with one-click autofill for immediate playground experimentation.
- **Live Metrics & Request Timeline**: Real-time developer dashboard tracking request frequencies, active sessions, and security event logs.

### Technology Stack
- **Framework**: React 19 (Frontend), Express 4 (Backend)
- **Build Tool / Dev Server**: Vite 6, Node.js
- **Styling**: Tailwind CSS (Dark Developer Dashboard theme)
- **Testing**: Jest, Supertest
- **Data**: Bundled local JSON dataset (`server/data/users.json`)

---

## 2. Debugging Challenge

QA engineers and security auditors have flagged several issues in the BugVault platform. Your goal is to investigate the codebase, reproduce each bug, and implement the necessary fixes so that all automated test suites pass.

### Reported Issues & Tasks:

#### Issue 1: Sliding Window Rate Limiter Allows Excess Requests
- **User Symptom**: The rate limiter is configured to allow a maximum of 5 requests per 60-second window, but when sending rapid requests, the 6th request unexpectedly succeeds instead of receiving an HTTP 429 (`Too Many Requests`) response, and the window resets prematurely.
- **Task**: Fix the sliding window calculation and boundary condition in `server/middleware/rateLimiter.js` so that requests exceeding 5 within 60 seconds are blocked with HTTP 429.

#### Issue 2: Expired JWT Tokens Accepted by Protected Routes
- **User Symptom**: When a user attempts to access protected endpoints using an expired JWT token (whose expiration timestamp has elapsed), the server accepts the token and returns HTTP 200 rather than rejecting the request with HTTP 401 (`Unauthorized`).
- **Task**: Update the authentication middleware in `server/middleware/auth.js` to enforce token expiration checks and reject expired tokens with HTTP 401.

#### Issue 3: Insecure Direct Object Reference (IDOR) on Profile Endpoint
- **User Symptom**: Authenticated users can specify another user's ID in the profile URL parameter (e.g., `GET /api/profile/2`) and view private profile details belonging to other users instead of receiving an HTTP 403 (`Forbidden`) error.
- **Task**: Enforce ownership authorization checks in `server/routes/profile.js` to ensure users can only access their own profile information matching their authenticated user ID.

#### Issue 4: Plain Text Password Storage and Verification
- **User Symptom**: User credentials in `server/data/users.json` are stored as raw, unhashed strings, and the authentication route performs direct string equality checks instead of verifying secure password hashes.
- **Task**: Hash all user passwords using `bcrypt` in `server/data/users.json` and update `server/routes/auth.js` to securely verify passwords using `bcrypt.compare`.

#### Issue 5: User Directory Pagination Skips Records
- **User Symptom**: When navigating to the second page of users (`page=2&limit=10`) in a 20-record database, the API returns an empty list (`[]`) because records 11 through 20 are skipped entirely.
- **Task**: Correct the pagination offset calculation in `server/routes/users.js` so that each page displays the proper slice of user records without omitting entries.

#### Issue 6: Concurrent Failed Login Attempts Bypass Account Lockout
- **User Symptom**: The security system is designed to lock an account after 5 failed login attempts (returning HTTP 423 `Locked`), but sending concurrent failed login requests allows requests to read stale attempt counts, bypassing the lockout threshold.
- **Task**: Fix the race condition in `server/routes/auth.js` so that concurrent failed login attempts accurately increment the attempt counter and trigger account lockout after 5 failures.

---

## 3. Expected Behavior After Fixing Bugs

After resolving the issues:
1. Sending more than 5 requests within a 60-second window triggers an HTTP 429 Too Many Requests response with appropriate rate limit headers.
2. Protected endpoints reject expired JWT tokens with an HTTP 401 Unauthorized status.
3. Querying another user's profile ID returns an HTTP 403 Forbidden response.
4. User passwords in `server/data/users.json` are stored as bcrypt hashes, and login authenticates credentials via `bcrypt.compare`.
5. Requesting page 2 with limit 10 returns users 11 through 20 without missing or skipped records.
6. Concurrent failed login attempts properly trigger an account lockout with HTTP 423 once the 5-attempt threshold is reached.
7. All automated tests in `server/tests/` pass with exit code `0`.