# Project Implementation Status & Roadmap

This document serves as the implementation status, technical debt log, and development roadmap for the Movie Reservation System.

---

## Project Overview

### Description
The Movie Reservation System is a microservices-based application designed to allow users to search for movies, view details (cinemas, halls, showtimes, seat maps), choose seats, create reservations, and manage their bookings.

### High-Level Architecture
The project is split into separate microservices communicating behind an API Gateway, with a modern frontend interface:
- **Frontend**: A React web application powered by Vite, communicating with backend microservices via the API Gateway.
- **API Gateway**: A Node.js Express server routing traffic using `http-proxy-middleware` to direct API requests to the appropriate backend microservice based on endpoint prefixes.
- **Backend Services**:
  - **User Service**: Manage user registration, security, local and OAuth logins, and session management.
  - **Movie Service**: Catalog service for managing movies, cinemas, halls, and showtimes (currently a placeholder).
  - **Reservation Service**: Core business logic service for seat locks, reservation processing, and bookings history (currently a placeholder).

---

## Current Services

### 1. API Gateway
- **Purpose**: Acts as a reverse proxy and entry point for all service APIs, simplifying client access and handling cross-origin resource sharing (CORS).
- **Current Implementation Status**: Fully configured and operational.
- **Implemented Features**:
  - Express.js server on port `3000` with Morgan request logging and CORS configured to allow credentials and requests from the frontend.
  - Route routing maps:
    - `/api/users/*` &rarr; `http://user-service:3001/api/v1/users`
    - `/api/movies/*` &rarr; `http://movie-service:3002/api/v1/movies`
    - `/api/bookings/*` &rarr; `http://reservation-service:3003/api/v1/bookings`
  - Custom proxy middleware (`createServiceProxy.js`) to append client-original cookies (`cookie`) and authentication headers (`authorization`) to downstream requests, and correctly rebuild parsed request bodies (`fixRequestBody`).
  - Health check endpoint `/health` returning `{ status: "success", message: "API Gateway is running" }`.
- **Missing Features**:
  - Unified rate limiting at the gateway level (currently handled per-service).
  - SSL/TLS termination at the gateway level (assumed to be handled by a production proxy like Nginx, but not configured locally).
  - Gateway-level auth token validation/decoding (currently delegated entirely to the microservices).
- **Technical Debt & TODOs**:
  - The configuration references a `BOOKING_SERVICE_URL` in environment variables pointing to `reservation-service:3003`. The service name is inconsistent (`booking-service` vs `reservation-service`), which could lead to confusion.

### 2. User Service
- **Purpose**: Manages authentication, identity verification, access tokens, security policies, and administrator actions.
- **Current Implementation Status**: Extensively implemented with robust security controls.
- **Implemented Features**:
  - **Local Registration**: Validates email format and asserts password policy (minimum 8 characters). Hashes passwords with Bcrypt. Generates an email verification token, sends a verification email via Nodemailer, records an audit log, and issues JWT access and refresh tokens.
  - **Local Login**: Authenticates credentials, tracks failed login attempts, and temporarily locks accounts (default: 15 minutes) after a threshold of failed attempts (default: 5). Generates audit logs and returns access/refresh tokens.
  - **Session Rotation & Token Refresh**: Utilizes JWT access tokens (short-lived, 15 minutes) and database-stored random refresh tokens (long-lived, 30 days). Automatically rotates the refresh token upon access token refresh to prevent replay attacks.
  - **Refresh Token Reuse Protection**: Detects if a revoked or already rotated refresh token is presented. As a security precaution, it immediately revokes all active refresh tokens for that user to terminate all user sessions.
  - **Email Verification**: Exposes a link callback `/api/v1/users/verify-email/:token` which marks the user as verified.
  - **Forgot / Reset Password**: Generates password reset tokens and emails them to the user. Resetting a password updates the credentials, invalidates all other active refresh tokens to force re-authentication across other devices, and logs the event.
  - **Google OAuth Integration**: Provides an OAuth redirect route `/api/v1/users/auth/google` and callback handler `/api/v1/users/auth/google/callback`. Links Google logins to local accounts if the email matches, or creates a new pre-verified user account.
  - **Audit Logging**: Saves system security events (registration, login, logout, soft deletes, lockouts, password resets) to MongoDB.
  - **Session Revocation**: Allows users to revoke all active sessions (`/sessions/revoke`), clearing all associated refresh tokens.
  - **Soft Delete**: Enables users to soft-delete their own account, setting a `deletedAt` timestamp and invalidating all active sessions.
  - **Security Middleware**: Integrates `helmet` (security headers), `express-mongo-sanitize` (NoSQL injection prevention), `xss-clean` (cross-site scripting filtering), `hpp` (parameter pollution prevention), and custom rate-limiters (`express-rate-limit`) for authentication, OAuth, and password reset endpoints.
  - **Admin Actions**: Enforces role checks (`restrictTo('admin')`) and permits listing all active users (`GET /api/v1/users/`).
- **Missing Features**:
  - **Profile Management API**: Lack of endpoints/schemas to edit user profile details (e.g. name, phone number, avatar).
  - **Resend Verification Email**: No API endpoint allows a user to request a new verification email if the registration email fails to deliver or expires.
  - **Password Change (Logged In)**: Lacks an endpoint to update password while authenticated without triggering a full password reset flow.
- **Technical Debt & TODOs**:
  - The repository features no automated test suite. The `npm test` script only executes a syntax check using `node --check`.
  - Email verification is required by `ensureVerified` middleware on the `/me` profile retrieval route. However, after registration, the user is signed in with `isVerified: false`. This causes an immediate `403 Forbidden` error when fetching profile details on the frontend.

### 3. Movie Service
- **Purpose**: Manages the movie catalog, theater locations, screening halls, seat configurations, and showtime schedules.
- **Current Implementation Status**: Not started.
- **Implemented Features**:
  - Boilerplate directory structures (`config`, `controllers`, `middleware`, `models`, `routes`, `services`, `utils`) and a Dockerfile.
- **Missing Features**:
  - Core service implementation: Express setup, database connection, and query abstractions.
  - Database schemas (Movie, Cinema, Hall, Showtime, Seat).
  - CRUD REST APIs for movies, cinema rooms, and showtimes.
- **Technical Debt & TODOs**:
  - Empty entrypoint file `src/app.js`.
  - Empty folders inside `src/`.
  - Placeholder configuration in `docker-compose.yml` that sleeps indefinitely (`sh -c "while true; do sleep 3600; done"`).

### 4. Reservation Service
- **Purpose**: Manages showtime seat bookings, ticket issuance, seat-locking during checkouts, payment state tracking, and booking history.
- **Current Implementation Status**: Not started.
- **Implemented Features**:
  - Boilerplate directory structures and a Dockerfile.
- **Missing Features**:
  - Express application codebase.
  - Database schema representing Booking/Reservation (referencing User ID, Showtime ID, Selected Seats, Price, Expiry, and Status).
  - Seat booking state machine: Lock seats &rarr; Complete Payment &rarr; Finalize Reservation.
  - Concurrency handling (e.g. using database transactions or Redis locks) to guarantee no double-booking of seats during high-demand sessions.
- **Technical Debt & TODOs**:
  - Empty entrypoint file `src/app.js`.
  - Empty folders inside `src/`.
  - Docker container set to sleep indefinitely (`sh -c "while true; do sleep 3600; done"`).

---

## Frontend

### Implemented Pages
- **Login** (`Login.jsx`): Credentials input form (email + password) with error handling. Communicates with `AuthContext` to authenticate.
- **Register** (`Register.jsx`): Registration form (email, password, password confirmation).
- **Movies** (`Movies.jsx`): Displays a placeholder card showing "Movies Service Coming Soon".
- **Movie Details** (`MovieDetails.jsx`): Displays the route's `movieId` parameter and a reminder that the reservation flow placeholder is disconnected.
- **My Reservations** (`MyReservations.jsx`): Displays a static screen indicating no bookings exist yet.
- **NotFound** (`NotFound.jsx`): Simple fallback 404 screen.

### Implemented Features
- **Global Auth Provider** (`AuthContext.jsx`): Keeps track of `accessToken`, `user` profile object, loading states, and login/register/logout handlers.
- **Session Restoring**: Re-authenticates users on load by reading local storage tokens or automatically triggering `/users/refresh-token` to retrieve new session credentials via HTTP cookies.
- **Axios HTTP Client** (`api.js`):
  - Automatically appends JWT access token `Bearer` headers to outgoing queries.
  - Uses response interceptors to catch `401 Unauthorized` responses and initiate token refreshes. If refresh fails, it clears credentials and triggers an `auth:logout` event to clean application state.
- **Route Guards** (`ProtectedRoute.jsx`): Restricts movie catalogs and detail views to logged-in users. Shows a loading spinner during session restorations.

### Connected Backend APIs
Only endpoints in the **User Service** (via API Gateway) are connected:
- `POST /api/users/register` &rarr; User registration
- `POST /api/users/login` &rarr; Credentials authentication
- `POST /api/users/logout` &rarr; Session termination
- `POST /api/users/refresh-token` &rarr; Rotation of refresh token
- `GET /api/users/me` &rarr; Retrieves logged-in user profile

### Missing Frontend Functionality & UI Features
- **OAuth Login**: No "Login/Sign In with Google" option is present in the login/register UI, despite backend integration.
- **Forgot/Reset Password Forms**: No UI exists for users who forgot their password or need to reset it.
- **Email Verification Interface**:
  - There is no screen telling users to check their email for a verification link post-registration.
  - No verification callback route (`/verify-email/:token`) exists to receive users returning from email links and report success/failure.
- **Movie Catalog Display**: No code to fetch, paginate, filter, or search movies.
- **Showtime Selection**: No showtime/session schedule interface for a chosen movie.
- **Seat Mapping**: Lacks an interactive seat selection layout for booking.
- **Reservation Checkouts**: No booking forms or payment simulator screens.
- **Actual Reservations Listing**: The page is entirely hardcoded; it does not perform fetch requests to retrieve bookings.
- **User Account Settings**: No profile customization page (e.g. soft deleting, revoking sessions).

---

## Overall Progress

### Completed Features
- API Gateway proxy configurations and cookie/header routing.
- User Service authentication flows: Local register, Login, Refresh token rotation, Revocation/Replay precautions, Google OAuth APIs, Forgot/Reset password APIs, and soft deletion.
- User Service security headers, parameters parsing, data sanitization (XSS, NoSQL query injection), and API rate limiters.
- Frontend base structure: Axios interceptors, JWT storage, route guard, and authentication state context.

### Features In Progress
- Docker Compose configuration (mostly configured but database services and actual container configurations are incomplete/broken).

### Features Not Started
- Movie Service backend and database schemas.
- Reservation Service backend, reservation transactions, and payment logic.
- Complete Movie Catalog UI (listing, sorting, filtering).
- Showtime and screen reservation UI (seat booking matrix).
- Real Booking listings and cancellation UI on the frontend.
- Backend automated test suites.

---

## Recommended Development Order

To build out this repository systematically and correctly, the following development order is recommended:

### 1. Fix Docker Compose & Database Infrastructure
- **Why**: Currently, starting the system via `docker compose up` will crash the User Service because there is no MongoDB service container declared.
- **Actions**: Define a `mongo` service container in `docker-compose.yml` and set up standard network bridges.

### 2. Implement Frontend Email Verification & Password Reset Flows
- **Why**: The User Service enforces email verification for accessing `/me`. Since the frontend currently lacks a screen for email verification redirects, users are immediately locked out after registering.
- **Actions**: Add a `/verify-email/:token` route to handle callback verification, a landing message for unverified accounts, and forgot-password request pages. Add a backend route to resend verification emails.

### 3. Add Google OAuth to the Frontend UI
- **Why**: Backend OAuth functionality is complete but inaccessible to users.
- **Actions**: Place "Sign in with Google" buttons on `Login` and `Register` components that redirect to the `/api/users/auth/google` gateway route.

### 4. Implement Movie Service (Backend)
- **Why**: To provide the necessary catalog APIs (movies, locations, halls, showtimes) before building booking flows.
- **Actions**: Configure Express, connect to MongoDB, model Movie/Cinema/Showtime/Seat schemas, and create CRUD routes. Update API Gateway proxies to confirm traffic routing.

### 5. Connect Frontend Movies Views to Movie Service
- **Why**: Allows users to browse dynamic movies and select showtimes, replacing hardcoded placeholders.
- **Actions**: Implement Axios endpoints for movie lists and details, and render database-driven cards and schedules on `/movies` and `/movies/:movieId`.

### 6. Implement Reservation Service (Backend)
- **Why**: Core logic depends on available showtimes. Requires seat availability states from the Movie Service.
- **Actions**: Create Express application, define Booking schema, write logic to temporarily lock seats (with TTLs) and finalize reservations upon simulated payment success.

### 7. Connect Reservation Flow in Frontend
- **Why**: To complete the user experience cycle.
- **Actions**: Build an interactive seat grid showing free/occupied seats based on showtime state. Implement booking buttons and display user ticket history on `/my-reservations`.

### 8. Add Concurrency Control & Automated Testing
- **Why**: Critical for high-traffic environments to prevent double-booking.
- **Actions**: Implement locking mechanisms in the reservation service (e.g. MongoDB transactions or Redis). Build automated integration/unit tests for User, Movie, and Reservation microservices.

---

## Notes

### Discovered Bugs, Inconsistencies & Deficiencies
1. **Broken Docker Setup**: There is no database service defined in `docker-compose.yml`. The `user-service` is set to connect to `DATABASE=mongodb://mongo:27017/user-service` inside Docker, which fails because the `mongo` container does not exist.
2. **Registration-Verification Trap**: The `/me` endpoint (used on mount to retrieve the active user profile) is guarded by the `ensureVerified` middleware. When a user registers, their `isVerified` flag is initially `false`. The user is successfully authenticated and receives tokens, but any subsequent frontend fetch to `/me` results in a `403 Forbidden`. The frontend has no route, notification page, or resend mechanism for this, causing a broken authentication loop.
3. **Empty Test Suite**: The `package.json` scripts inside the User Service define `"test": "node --check src/app.js"` which checks file syntax only and does not execute any test suite assertions.
4. **Sleep Loop Placeholders**: The `movie-service` and `reservation-service` containers in the Docker configuration run sleeping loops (`sh -c "while true; do sleep 3600; done"`) and their codebases are empty files.
5. **Gateway Environment Naming Inconsistency**: The API Gateway maps the `/api/bookings` route to the `BOOKING_SERVICE_URL` variable, which routes to the `reservation-service` container. Standardizing the terminology (`booking` vs `reservation`) across files and configs would avoid developer confusion.
