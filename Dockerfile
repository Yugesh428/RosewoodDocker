# ──────────────────────────────────────────────────────────────────────────────
# Rosewood Pharmacy — Dockerfile
# Multi-stage: deps → builder → runner
# This Dockerfile expects rosewood source files in the rosewood/ subdirectory
# ──────────────────────────────────────────────────────────────────────────────

# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY rosewood/package.json rosewood/package-lock.json ./
RUN npm ci --ignore-scripts

# ── Stage 2: build Next.js ────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY rosewood/ .
COPY seed-admin.ts seed-heavy.ts ./docker/

ENV NEXT_TELEMETRY_DISABLED=1
# Provide a dummy DATABASE_URL so sequelize.ts doesn't warn during build.
# It is never actually connected to — Next.js only statically analyzes routes.
ENV DATABASE_URL=postgres://build:build@localhost:5432/build
ENV NEXTAUTH_SECRET=build-time-placeholder
ENV NEXTAUTH_URL=http://localhost:3000
RUN npm run build

# ── Stage 3: production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public

# Copy scripts/seed for the seed service
COPY --from=builder --chown=nextjs:nodejs /app/src                    ./src
COPY --from=builder --chown=nextjs:nodejs /app/node_modules           ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json          ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.scripts.json  ./tsconfig.scripts.json
COPY --from=builder --chown=nextjs:nodejs /app/docker                 ./docker

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
