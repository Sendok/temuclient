# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS source
COPY . .
RUN npm run db:generate

FROM source AS builder
# Non-secret build-time values. Runtime configuration is injected by the platform.
ENV NODE_ENV=production \
    APP_ENV=staging \
    APP_URL=http://localhost:3000 \
    AUTH_SECRET=build-only-secret-not-used-at-runtime-0000000000 \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    REDIS_URL=redis://localhost:6379 \
    RATE_LIMIT_FAIL_OPEN=false \
    S3_PROVIDER=mock \
    EMAIL_PROVIDER=log \
    EMAIL_FROM=noreply@temuclient.local \
    BILLING_PROVIDER=sandbox \
    BILLING_WEBHOOK_SECRET=build-only-webhook-secret \
    ANALYTICS_PROVIDER=database \
    AI_PROVIDER=deterministic
RUN npm run build

FROM source AS migration
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
CMD ["npm", "run", "db:migrate:deploy"]

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=4 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/v1/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
