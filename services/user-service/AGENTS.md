# Repository Guidelines

## Project Structure & Module Organization
This service is a Node.js/Express user domain microservice focused on authentication and identity.

- `src/app.js`: app bootstrap, global middleware, route mounting, error handling, server startup.
- `src/config/`: environment-driven config (`auth.js`, `db.js`, `validateEnv.js`).
- `src/controllers/`: HTTP handlers only; no heavy business logic.
- `src/services/`: core auth/user/oauth workflows.
- `src/repositories/`: data-access layer over Mongoose models.
- `src/models/`: MongoDB schemas (`User`, `RefreshToken`, reset/verification tokens, audit/logins).
- `src/middleware/`: auth guards and rate-limit middleware.
- `src/routes/`: route definitions (`userRoutes.js`).
- `src/utils/`: shared helpers (tokens, email, cookies, errors, audit logger).
- Root config: `config.env`, `config.env.example`, `package.json`.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: run with file watching (`node --watch src/app.js`).
- `npm start`: start service normally.
- `npm test`: syntax check entrypoint (`node --check src/app.js`).
- `npm run test:auth`: syntax check auth service (`node --check src/services/authService.js`).

## Coding Style & Naming Conventions
- Use CommonJS (`require`/`module.exports`) and 2-space indentation.
- Keep files scoped by role: `*Controller.js`, `*Service.js`, `*Repository.js`, `*Model.js`.
- Prefer `camelCase` for variables/functions and `PascalCase` for Mongoose model names.
- Keep controllers thin; place business rules in services and DB logic in repositories.
- Return consistent JSON payload shape (`status`, `message`, `data`).

## Testing Guidelines
- Current checks are syntax-only via Node’s `--check`.
- Add integration tests for auth flows (register/login/refresh/logout/reset/OAuth) before production rollout.
- Suggested naming: `<feature>.integration.js` under a future `tests/` directory.

## Commit & Pull Request Guidelines
- This folder currently has no readable `.git` metadata; use Conventional Commits going forward.
- Recommended commit format: `feat(auth): rotate refresh tokens` or `fix(middleware): enforce role check`.
- PRs should include:
- clear scope and risk summary,
- linked issue/ticket,
- test evidence (commands run and results),
- sample request/response payloads for endpoint changes.

## Security & Configuration Tips
- Never commit real secrets; keep `config.env.example` sanitized.
- Rotate `JWT_SECRET` regularly and use strong production values.
- Ensure rate limits, account lockout, and token revocation remain enabled.
