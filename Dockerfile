# syntax=docker/dockerfile:1
# =============================================================================
# ALL-IN-ONE image for Hugging Face Spaces (free, no card, single container).
#
# HF Spaces run ONE container exposing ONE port (7860). So this image co-locates
# the whole microservices stack — MySQL + MinIO + the 3 TCP services + gateway +
# nginx(SPA) — and the entrypoint (huggingface/start.sh) boots them in order.
# In real production each piece is its own container (see docker-compose.prod.yml);
# this image exists only to give a clickable, always-reachable demo for free.
#
# Build context = repo ROOT (so it can build both backend/ and frontend/).
# Ubuntu 22.04 is used for BOTH build and runtime so the native bcrypt binary's
# glibc/ABI matches (mixing Debian + Ubuntu bases risks a GLIBC error at runtime).
# =============================================================================

# ---- Build backend (npm workspace) ------------------------------------------
FROM ubuntu:22.04 AS backend-build
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates curl gnupg \
	&& curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
	&& apt-get install -y --no-install-recommends nodejs python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
COPY backend/common/package.json common/package.json
COPY backend/gateway/package.json gateway/package.json
COPY backend/identity/package.json identity/package.json
COPY backend/employees/package.json employees/package.json
COPY backend/attendances/package.json attendances/package.json
RUN npm ci
COPY backend/ ./
RUN npm run build

# ---- Build frontend (Vite, single-origin relative URLs) ---------------------
FROM ubuntu:22.04 AS frontend-build
ENV DEBIAN_FRONTEND=noninteractive
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_API_ORIGIN=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_API_ORIGIN=${VITE_API_ORIGIN}
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates curl gnupg \
	&& curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
	&& apt-get install -y --no-install-recommends nodejs \
	&& rm -rf /var/lib/apt/lists/*
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Runtime (MySQL + MinIO + Node + nginx in one image) --------------------
FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
	&& apt-get install -y --no-install-recommends ca-certificates curl gnupg \
	&& curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
	&& apt-get install -y --no-install-recommends \
		nodejs nginx mysql-server-core-8.0 mysql-client-core-8.0 \
	&& curl -fsSL https://dl.min.io/server/minio/release/linux-amd64/minio \
		-o /usr/local/bin/minio \
	&& chmod +x /usr/local/bin/minio \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=backend-build /app/backend /app/backend
COPY --from=frontend-build /app/frontend/dist /app/frontend
COPY huggingface/nginx.conf /app/huggingface/nginx.conf
COPY huggingface/start.sh /app/start.sh

# World-writable so the stack also runs if HF launches us as a non-root user.
RUN chmod +x /app/start.sh \
	&& chmod -R 777 /app/huggingface \
	&& mkdir -p /var/lib/nginx /var/log/nginx \
	&& chmod -R 777 /var/lib/nginx /var/log/nginx

EXPOSE 7860
CMD ["/app/start.sh"]
