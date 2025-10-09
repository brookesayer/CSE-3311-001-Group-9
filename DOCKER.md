Dockerized Setup

This project includes a FastAPI backend and a Vite (React) frontend. The provided Dockerfiles and docker-compose.yml run both services locally.

Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)

Quick Start
1) Build images
   docker compose build

2) Run containers
   docker compose up -d

3) Open the app
   Frontend: http://localhost:8080
   API:      http://localhost:8000/api/places

Notes
- Backend defaults to file mode (USE_DB=0) and serves data from backend/data/places.json and images from backend/static/.
- Frontend is served by Nginx and proxies /api to the backend container, so no CORS issues. For this, build the frontend with an empty VITE_API_BASE.
- To use a database, set USE_DB=1 and provide a DATABASE_URL that matches your DB. Ensure the required dependencies are installed inside the image.
- If you change environment variables used by the frontend (e.g., VITE_API_BASE in simpleapp/.env), rebuild the frontend image so the values are baked into the build.

Common Commands
- Start: docker compose up -d
- Stop:  docker compose down
- Logs:  docker compose logs -f
