# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/*

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Syntax-only URLs satisfy the existing Prisma config during generation/build.
# No real database URL or AI key is passed to the image build.
RUN DATABASE_URL=postgresql://127.0.0.1:5432/build_validation \
    DIRECT_URL=postgresql://127.0.0.1:5432/build_validation \
    npm run build \
    && mkdir -p public

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN groupadd --gid 1001 nextjs \
    && useradd --uid 1001 --gid nextjs --no-create-home nextjs
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nextjs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/ping').then(async r => { if (!r.ok || (await r.json()).ok !== true) process.exit(1); }).catch(() => process.exit(1))"
CMD ["node", "server.js"]
