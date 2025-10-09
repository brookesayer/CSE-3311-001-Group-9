# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps using package.json (and lockfile if it exists)
COPY simpleapp/package*.json ./
RUN npm install --no-audit --no-fund

# Copy app source (including .env for Vite build)
COPY simpleapp/ ./

# Include a fallback dataset so the app shows content even if API is down
# This will be served as /places.json
COPY backend/data/places.json ./public/places.json

# Build production assets
RUN npm run build

# ---- Runtime stage ----
FROM nginx:alpine

# Copy Nginx config to enable SPA fallback and API proxy
COPY simpleapp/nginx.conf /etc/nginx/conf.d/default.conf

# Static assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
