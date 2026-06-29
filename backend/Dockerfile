# syntax=docker/dockerfile:1
# =============================================================================
# Dexa WFH backend — single multi-stage, multi-target Dockerfile for the whole
# npm workspace (PLAN Tahap 11.1).
#
# Why one Dockerfile with multiple targets instead of four?
#   The workspace MUST keep a SINGLE deduped copy of @nestjs/* (see PLAN gotchas)
#   — that only holds if `npm ci` runs ONCE at the workspace root. So we install
#   + build the whole workspace once in the shared `builder` stage, then each
#   service gets a lean runtime stage that copies only its compiled dist plus the
#   shared production node_modules. docker-compose selects the stage via `target`.
#
# Targets:
#   builder       — full workspace (all deps + src + dist + ts-node). Also reused
#                   as the one-shot `migrate` container (needs ts-node + the
#                   seed assets that live in src/).
#   gateway       — HTTP boundary  (node gateway/dist/main)
#   identity      — TCP 4001        (node identity/dist/main)
#   employees     — TCP 4002        (node employees/dist/main)
#   attendances   — TCP 4003        (node attendances/dist/main)
# =============================================================================

# ---- Stage: builder (full workspace install + compile) ----------------------
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Toolchain for native modules (bcrypt) — kept out of the runtime stages.
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

# Copy only manifests first so `npm ci` is cached until a dependency changes.
COPY package.json package-lock.json ./
COPY common/package.json common/package.json
COPY gateway/package.json gateway/package.json
COPY identity/package.json identity/package.json
COPY employees/package.json employees/package.json
COPY attendances/package.json attendances/package.json
RUN npm ci

# Copy the rest of the workspace and build common + all four services.
COPY . .
RUN npm run build

# ---- Stage: proddeps (production-only node_modules, shared by all services) --
# A second `npm ci --omit=dev` so runtime images don't carry typescript/jest/etc.
# Installing at the workspace root yields the UNION of every service's prod deps,
# which conveniently satisfies @dexa/common's peer deps in every runtime image.
FROM node:20-bookworm-slim AS proddeps
WORKDIR /app
RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY common/package.json common/package.json
COPY gateway/package.json gateway/package.json
COPY identity/package.json identity/package.json
COPY employees/package.json employees/package.json
COPY attendances/package.json attendances/package.json
RUN npm ci --omit=dev

# ---- Reusable runtime base --------------------------------------------------
# Brings in the shared prod node_modules + the built @dexa/common. The workspace
# symlink node_modules/@dexa/common -> ../common resolves because we place the
# compiled common package at /app/common.
FROM node:20-bookworm-slim AS runtime-base
WORKDIR /app
ENV NODE_ENV=production
COPY --from=proddeps /app/node_modules ./node_modules
COPY --from=builder /app/common/package.json ./common/package.json
COPY --from=builder /app/common/dist ./common/dist

# ---- Stage: gateway ---------------------------------------------------------
FROM runtime-base AS gateway
COPY --from=builder /app/gateway/package.json ./gateway/package.json
COPY --from=builder /app/gateway/dist ./gateway/dist
EXPOSE 3000
CMD ["node", "gateway/dist/main"]

# ---- Stage: identity --------------------------------------------------------
FROM runtime-base AS identity
COPY --from=builder /app/identity/package.json ./identity/package.json
COPY --from=builder /app/identity/dist ./identity/dist
EXPOSE 4001
CMD ["node", "identity/dist/main"]

# ---- Stage: employees -------------------------------------------------------
FROM runtime-base AS employees
COPY --from=builder /app/employees/package.json ./employees/package.json
COPY --from=builder /app/employees/dist ./employees/dist
EXPOSE 4002
CMD ["node", "employees/dist/main"]

# ---- Stage: attendances -----------------------------------------------------
FROM runtime-base AS attendances
COPY --from=builder /app/attendances/package.json ./attendances/package.json
COPY --from=builder /app/attendances/dist ./attendances/dist
EXPOSE 4003
CMD ["node", "attendances/dist/main"]
