# syntax=docker/dockerfile:1
# =============================================================================
# Frontend (React + Vite) — build static assets, serve via nginx.
#
# The app is deployed behind Caddy on a SINGLE public origin, so the API base
# and photo origin are RELATIVE by default (/api/v1 and "" -> /uploads/...).
# Override the build args only if the frontend is hosted on a different origin
# than the gateway.
# =============================================================================

# ---- Stage: build -----------------------------------------------------------
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Vite inlines VITE_* at build time, so they must be present BEFORE `npm run build`.
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_API_ORIGIN=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_ORIGIN=${VITE_API_ORIGIN}

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Stage: serve -----------------------------------------------------------
FROM nginx:1.27-alpine AS serve
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80