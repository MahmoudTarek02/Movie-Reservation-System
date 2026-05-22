# API Gateway

This API Gateway is the single entry point for the Movie Reservation System frontend.

## Runs on

`http://localhost:3000`

## Proxied routes

- `/api/users` -> user-service
- `/api/movies` -> movie-service
- `/api/bookings` -> booking-service

## Environment variables

Create an `.env` file in `api-gateway/` using `.env.example`.

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
USER_SERVICE_URL=http://localhost:3001
MOVIE_SERVICE_URL=http://localhost:3002
BOOKING_SERVICE_URL=http://localhost:3003
```

## Install and run

```bash
npm install
npm run dev
```

For a production-style start:

```bash
npm start
```

## Request flow

1. The frontend sends requests to `http://localhost:3000/api/...`
2. The gateway logs the request, applies CORS rules, and matches the route prefix
3. `http-proxy-middleware` forwards the request to the target microservice
4. Response headers, auth headers, cookies, and JSON responses are passed back through the gateway to the frontend

## Add a new service later

1. Add the service URL to `.env`
2. Register the service in `src/config/services.js`
3. Add one proxy route in `src/routes/index.js`

This structure scales well because route registration and proxy behavior stay centralized instead of being scattered across the app.
