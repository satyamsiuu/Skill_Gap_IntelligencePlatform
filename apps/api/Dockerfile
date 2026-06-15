# SGIP — API + Worker Dockerfile
# Ticket: SGIP-1.3.2.1
#
# Multi-stage build with 4 stages:
#   1. deps    — installs ALL dependencies (prod + dev) for building
#   2. builder — TypeScript compilation
#   3. runner  — production image (prod deps only, non-root user, small footprint)
#   4. worker  — extends runner, overrides CMD for the worker process
#
# ─── Build Usage ───────────────────────────────────────────────────────────────
#   API:    docker build --target runner -t sgip-api .
#   Worker: docker build --target worker -t sgip-worker .
#
# ─── Run with OTel ─────────────────────────────────────────────────────────────
#   docker run -e OTEL_ENABLED=true -e OTEL_EXPORTER_OTLP_ENDPOINT=http://otel:4318 \
#     -e DATABASE_URL=... sgip-api
#
# ─── Notes ─────────────────────────────────────────────────────────────────────
# - Non-root user (sgip:nodejs, uid 1001/1001) — CRITICAL security requirement (Document 3)
# - Prisma client is generated as part of the build (not at runtime)
# - NODE_ENV=production is set in the runner stage to prevent dev-only code paths
# - Avoid COPY . . before dependencies — layer cache optimization

ARG NODE_VERSION=22
ARG PNPM_VERSION=10

# ═══════════════════════════════════════════════════════════════
# Stage 1: deps — install all dependencies for build
# ═══════════════════════════════════════════════════════════════
FROM node:${NODE_VERSION}-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /workspace

# Copy workspace manifests first (cache layer before source)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all deps (dev + prod) for TypeScript compilation
RUN pnpm install --frozen-lockfile

# ═══════════════════════════════════════════════════════════════
# Stage 2: builder — compile TypeScript
# ═══════════════════════════════════════════════════════════════
FROM deps AS builder

# Copy shared package source and build it first (API depends on @sgip/shared)
COPY packages/shared ./packages/shared
RUN pnpm --filter @sgip/shared run build

# Copy API source
COPY apps/api ./apps/api

# Generate Prisma client (must happen before nest build)
RUN pnpm --filter @sgip/api exec prisma generate

# Compile TypeScript → dist/
RUN pnpm --filter @sgip/api run build

# Prune devDependencies — only production deps go into the final image
RUN pnpm --filter @sgip/api --prod deploy /deploy/api

# ═══════════════════════════════════════════════════════════════
# Stage 3: runner — production API image
# ═══════════════════════════════════════════════════════════════
FROM node:${NODE_VERSION}-alpine AS runner

# Security hardening (Document 3)
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs sgip

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Copy production dependencies (pruned)
COPY --from=builder --chown=sgip:nodejs /deploy/api/node_modules ./node_modules
# Copy compiled application
COPY --from=builder --chown=sgip:nodejs /workspace/apps/api/dist ./dist
# Copy Prisma schema for migrations (prisma migrate deploy)
COPY --from=builder --chown=sgip:nodejs /workspace/apps/api/prisma ./prisma
# Copy Prisma generated client
COPY --from=builder --chown=sgip:nodejs /workspace/node_modules/.pnpm/@prisma+client@*/node_modules/.prisma ./node_modules/.prisma 2>/dev/null || true

USER sgip

EXPOSE 4000

# dumb-init ensures proper signal handling (SIGTERM → graceful shutdown)
# This propagates SIGTERM to node process so pino + OTel flush properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]

# ─── Health check for container orchestrators ──────────────────────────────────
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/v1/health | grep -q '"status"' || exit 1

# ═══════════════════════════════════════════════════════════════
# Stage 4: worker — same image, different entrypoint
# ═══════════════════════════════════════════════════════════════
FROM runner AS worker

# Workers process background jobs — they MUST NOT expose an HTTP port
# (no EXPOSE here intentionally — workers have no inbound traffic)
CMD ["node", "dist/main-worker"]

# No HTTP health check for worker (it's a job processor, not a server)
# Liveness is inferred from BullMQ job processing rate (monitored externally)
HEALTHCHECK NONE
