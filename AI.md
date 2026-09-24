# AI Context

## Project

BugVault is a full-stack user management and security testing dashboard featuring token-based authentication, sliding window rate limiting, and a paginated user directory. It allows users to authenticate, inspect session tokens, manage profiles, and monitor real-time request quotas.

## Stack

- Node.js
- Express.js
- React 19
- Vite
- React Router DOM
- Tailwind CSS
- Axios
- JSON Web Tokens (`jsonwebtoken`)
- `bcrypt`
- Local JSON file storage

## Repository Structure

- `client/src/` — React frontend application source
- `client/src/components/` — UI components including global navigation and rate-limit visualization
- `client/src/pages/` — Core view components (`Login`, `Dashboard`, `Users`)
- `client/src/services/api.js` — Axios HTTP client configured with JWT interceptors, API service methods, and rate-limit event listeners
- `server/` — Express backend application source
- `server/server.js` — Express server setup registering middleware, security headers, and API routers
- `server/data/users.json` — Static JSON data file containing registered user records
- `server/middleware/auth.js` — Authentication middleware verifying bearer tokens from incoming requests
- `server/middleware/rateLimiter.js` — Sliding window rate limiter middleware tracking IP request timestamps in memory
- `server/routes/auth.js` — Authentication routes handling user login and seed credential inspection
- `server/routes/profile.js` — Profile routes handling authenticated user profile requests and ID lookups
- `server/routes/users.js` — Directory routes handling user listing, search filtering, and pagination
- `server/utils/jwt.js` — Token generation and signature verification helpers

## Important Logic

### `rateLimiter` (`server/middleware/rateLimiter.js`)
Tracks request timestamps per client IP within an in-memory store, clears timestamps older than the sliding window, and emits rate-limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`).

### `authenticate` (`server/middleware/auth.js`)
Extracts the Bearer token from the `Authorization` header, verifies the token against the application secret, and attaches the decoded user payload to `req.user`.

### `POST /api/login` (`server/routes/auth.js`)
Validates submitted email and password against the user dataset, tracks failed attempts to enforce account lockout thresholds, and issues a signed JWT upon successful validation.

### `GET /api/users` (`server/routes/users.js`)
Performs case-insensitive substring searches across user name, email, and role, calculates pagination offsets, and returns a page slice with total count metadata.

### `GET /api/profile/:id` (`server/routes/profile.js`)
Looks up and returns profile information for a specified user ID from the user dataset after authenticating the request.

### `authService` & API Interceptors (`client/src/services/api.js`)
Persists tokens and session metadata in `localStorage`, automatically injects `Authorization: Bearer <token>` into outbound requests, and broadcasts rate-limit header values to subscribers.

## Debugging Facts

- Authentication tokens and user metadata are stored in browser `localStorage` under `bugvault_token` and `bugvault_user`.
- In the frontend development setup, `/api` HTTP requests are proxied directly to the backend server on port 5000.
- All password fields are sanitized from user objects before profile and directory responses are returned to the client.
- User search filtering is applied across `name`, `email`, and `role` before pagination slicing occurs.
- Failed login attempt counters are tracked in an in-memory `Map` keyed by lowercase user email addresses.
- Rate limiting operates per client IP address and tracks timestamps in an in-memory sliding window.
- The client-side rate limit event bus captures headers from both successful responses and error responses (such as HTTP 429).
