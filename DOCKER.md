Docker Guide

This repository provides a Dockerized setup for:
- FastAPI backend (serves the API and static assets)
- Vite (React) frontend, built and served by Nginx with an API proxy

The `docker-compose.yml` builds and runs both services locally with sane defaults.

Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2 (`docker compose ...` CLI)

Quick Start
1) Build images
   docker compose build

2) Start services
   docker compose up -d

3) Open the app
   Frontend: http://localhost:8080
   API:      http://localhost:8000/api/places

Services
- backend
  - Image: built from `backend/Dockerfile`
  - Exposes port `8000`
  - Default mode: file-backed API (reads `backend/data/places.json`, serves images from `backend/static/`)
  - Optional DB mode: enabled when `USE_DB=1` with `DATABASE_URL` (SQLite, Postgres, etc.)
- frontend
  - Image: built from `simpleapp/Dockerfile`
  - Served by Nginx on port `80` (published as `8080`)
  - Proxies requests under `/api/` to the backend service (no CORS needed)

Configuration
- Backend env vars (see `docker-compose.yml`):
  - `USE_DB`: `0` (file mode) or `1` (DB mode). Compose sets `1` by default.
  - `DATABASE_URL`: connection string. In compose, SQLite is used: `sqlite:////app/dev.db`.
  - Compose also binds `./dev.db` (project root) to `/app/dev.db` inside the container to keep data on the host, which is especially helpful on Windows.
- Frontend build-time env:
  - Vite `VITE_*` variables are baked at build time. For the default Nginx proxy setup, leave `VITE_API_BASE` empty/relative so the app uses `/api`.
  - If you change frontend env (e.g., `simpleapp/.env`), rebuild the image:
    docker compose build frontend && docker compose up -d frontend

Data & Assets
- File mode: backend reads `backend/data/places.json`. If missing, it returns an empty list.
- Images: place under `backend/static/places/` and reference relatively; the API returns absolute URLs under `/static/...`.
- Frontend build includes a fallback dataset: `backend/data/places.json` is copied into the built site as `/places.json` so the UI still shows content if the API is down.

Health & Endpoints
- Health: `GET http://localhost:8000/api/health`
- Places: `GET http://localhost:8000/api/places`
- Static files: `http://localhost:8000/static/...`

Common Commands
- Start (detached):
  docker compose up -d
- Stop and remove containers:
  docker compose down
- View logs (all services):
  docker compose logs -f
- Rebuild a single service:
  docker compose build backend && docker compose up -d backend

Troubleshooting
- Port in use: change published ports in `docker-compose.yml` or stop the conflicting process.
- DB file path on Windows: compose already mounts `./dev.db` to `/app/dev.db`. If you move or delete `dev.db`, recreate it or update the volume mapping.
- Env changes not taking effect: frontend build-time vars require an image rebuild; backend runtime vars update on container restart.
- Clean rebuild if things look stale:
  docker compose down --volumes --remove-orphans
  docker compose build --no-cache
  docker compose up -d

Notes
- Backend container defaults to `USE_DB=0` inside the image, but `docker-compose.yml` overrides it to `USE_DB=1` with SQLite. Flip to file mode by setting `USE_DB=0` (or removing the envs) in compose.
- The frontend’s Nginx config proxies `/api/` to `http://backend:8000`, matching the compose service name. No CORS config is needed in the browser.
