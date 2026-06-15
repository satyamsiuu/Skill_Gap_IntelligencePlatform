# SGIP — Next.js Web App Dockerfile
# Ticket: SGIP-1.3.2.1
#
# Multi-stage build using Next.js standalone output mode.
# Standalone mode copies only the exact files needed to run, producing a
# minimal image (~50MB vs ~500MB without standalone).
#
# ─── Prerequisites ──────────────────────────────────────────────────────────────
# next.config.ts must include: output: 'standalone'
#
# ─── Build Usage ────────────────────────────────────────────────────────────────
#   docker build -t sgip-web .
#
# ─── Environment ────────────────────────────────────────────────────────────────
# NEXT_PUBLIC_API_URL — Set at build time (baked into static JS bundle) OR
#                        at runtime via the rewrite rules in next.config.ts.
#                        For runtime config: use NEXT_PUBLIC_API_URL="" at build
#                        and let the container set it at run.

ARG NODE_VERSION=22
ARG PNPM_VERSION=10

# ═══════════════════════════════════════════════════════════════
# Stage 1: deps — install all deps for build
# ═══════════════════════════════════════════════════════════════
FROM node:${NODE_VERSION}-alpine AS deps

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /workspace

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# ═══════════════════════════════════════════════════════════════
# Stage 2: builder — Next.js production build
# ═══════════════════════════════════════════════════════════════
FROM deps AS builder

ARG NEXT_PUBLIC_API_URL=""

COPY packages/shared ./packages/shared
RUN pnpm --filter @sgip/shared run build

COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm --filter @sgip/web run build

# ═══════════════════════════════════════════════════════════════
# Stage 3: runner — minimal Next.js standalone image
# ═══════════════════════════════════════════════════════════════
FROM node:${NODE_VERSION}-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy Next.js standalone output (contains only necessary files)
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/web/.next/standalone ./
# Copy static assets
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/web/.next/static ./apps/web/.next/static
# Copy public folder (favicon, og images, etc.)
COPY --from=builder --chown=nextjs:nodejs /workspace/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

# Next.js standalone server entry point
CMD ["node", "apps/web/server.js"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/ | grep -q 'SGIP' || exit 1
