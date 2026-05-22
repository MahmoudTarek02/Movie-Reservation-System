# Movie Reservation System

## Docker Compose Development Setup

This repository contains a microservices architecture with:
- `frontend` — Vite + React application
- `api-gateway` — Node.js Express gateway and proxy
- `services/user-service` — Node.js Express user service
- `services/movie-service` — placeholder movie service
- `services/reservation-service` — placeholder reservation service

### What was added
- `docker-compose.yml` for orchestrating all services
- Dockerfiles for frontend, api-gateway, user-service, movie-service, and reservation-service
- `.dockerignore` files for each service and the root context
- Service URLs updated to Docker service names for container networking
- Frontend proxy configured so `/api` routes go to the gateway inside Docker
- Development-friendly hot reload for frontend and gateway
- Healthchecks for frontend, gateway, and user-service

### Run the project
From the repository root:

```bash
cd "d:\Movie Reservation System\movie-reservation-system"
docker compose up --build
```

Then open:
- `http://localhost:5173` for the frontend
- `http://localhost:3000/health` for the API gateway
- `http://localhost:3001/health` for the user service

### Common Docker commands

```bash
docker compose up --build            # build and start all services
docker compose up                    # start services without rebuilding
docker compose down                 # stop and remove containers
docker compose logs -f              # stream logs for all services
docker compose logs -f api-gateway   # stream just gateway logs
docker compose ps                   # list running containers
```

### How services communicate
- Frontend requests `/api/*` locally.
- Vite proxy forwards `/api` requests to `http://api-gateway:3000` inside Docker.
- API gateway routes to backend services by Docker service name:
  - `http://user-service:3001`
  - `http://movie-service:3002`
  - `http://reservation-service:3003`

### Notes
- `frontend` and `api-gateway` are development-mode containers with source code mounted as volumes.
- `user-service` uses `services/user-service/config.env` for its runtime configuration.
- `movie-service` and `reservation-service` currently contain placeholder Docker containers.

### Debugging
- Confirm containers are running with `docker compose ps`.
- Check logs with `docker compose logs -f frontend api-gateway user-service`.
- Confirm networking with `docker compose exec api-gateway curl -I http://user-service:3001/health`.
- If frontend still fails, make sure `VITE_API_BASE_URL=/api` is present in `frontend/.env`.
