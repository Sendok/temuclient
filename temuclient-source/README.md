# TemuClient V1

TemuClient is a **Verified B2B Opportunity Network** built around:

```text
Need → Qualification → Match → Introduction → Meeting → Deal
```

The repository contains the complete TemuClient V1 Phase 0–10 implementation.
Public staging deployment and production launch are controlled release
activities, not an automatic Phase 11.

## Prerequisites

- Node.js 20.9 or newer (Node.js 24 is supported)
- npm 11 or newer
- Docker Desktop with Docker Compose

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env
   ```

3. Start PostgreSQL and Redis:

   ```bash
   docker compose up -d
   docker compose ps
   ```

4. Generate the Prisma client and apply migrations:

   ```bash
   npm run db:generate
   npm run db:migrate:deploy
   npm run db:status
   ```

5. Load deterministic development accounts:

   ```bash
   npm run db:seed
   ```

6. Start the application:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Infrastructure health is available at [http://localhost:3000/api/v1/health](http://localhost:3000/api/v1/health).

## Development seed credentials

All seeded accounts use `TemuClient123!` locally:

| Account | Email |
|---|---|
| Platform admin | `admin@temuclient.local` |
| Provider owner — Sagara Software | `provider@temuclient.local` |
| Buyer owner — PT Nusantara Logistik | `buyer@temuclient.local` |

These credentials are development-only and must never be used in production.

The seed also creates 15 service categories, 15 industries, 10 technologies, and 10 fictional Indonesian B2B Provider profiles with varied capabilities and project ranges.

The Buyer seed includes an active `Warehouse Management System` Opportunity for PT Nusantara Logistik. Requirement Builder endpoints work without an AI API key through a deterministic manual-review fallback and never publish automatically.

## Validation

Run the required release checks:

```bash
npm run lint
npm run typecheck
npm test
RUN_INFRASTRUCTURE_TESTS=true npm test
RUN_DATABASE_TESTS=true npm test
npm run build
```

The standard test command runs unit tests and reports the opt-in infrastructure suite as skipped. The opt-in command requires healthy Docker services and verifies real PostgreSQL and Redis connections.

## Common commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local Next.js development server |
| `npm run build` | Create the production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm test` | Run the Vitest suite once |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create/apply a development migration |
| `npm run db:migrate:deploy` | Apply committed migrations |
| `npm run db:status` | Inspect migration status |
| `npm run db:seed` | Load deterministic Phase 1 development accounts |
| `npm run staging:preflight` | Validate public staging configuration without printing secrets |
| `npm run staging:rehearsal:up` | Build and start the isolated local release rehearsal |
| `npm run staging:rehearsal:down` | Stop the local release rehearsal while retaining its volumes |

## Architecture

TemuClient uses a modular monolith:

```text
src/
  app/          Next.js App Router and API v1 route handlers
  components/   Reusable UI and domain presentation components
  modules/      Domain services, validation, permissions, repositories
  server/       Database, Redis, auth, storage, email, and queue adapters
  lib/          Shared cross-cutting utilities
prisma/         Prisma schema and committed migrations
tests/          Unit, integration, and later E2E coverage
docs/           Product and architecture source of truth
```

Important feature work must preserve this flow:

```text
UI → Validation → Authorization → Domain Service → Repository / Database
```

Read [AGENTS.md](./AGENTS.md), [MASTER_DEVELOPMENT_PLAN.md](./MASTER_DEVELOPMENT_PLAN.md), and all documents under [`docs/`](./docs) before making product changes.

## Environment

Core runtime configuration:

- `APP_URL`
- `DATABASE_URL`
- `REDIS_URL`
- `AUTH_SECRET` (minimum 32 characters)

The environment parser validates server configuration at runtime and reports
invalid field names without printing secret values. Use `.env.staging.example`
with the platform secret store for public staging. See
[`docs/STAGING_RELEASE.md`](./docs/STAGING_RELEASE.md) for the controlled release
and formal approval procedure.

## Troubleshooting

- If the health endpoint reports `degraded`, run `docker compose ps` and wait for both services to become healthy.
- If migration commands cannot connect, confirm `.env` exists and `DATABASE_URL` matches Docker Compose.
- The Compose defaults use host ports `5433` for PostgreSQL and `6380` for Redis to avoid common local-service conflicts. Override them with `POSTGRES_PORT` and `REDIS_PORT`, and keep the matching URLs in `.env` aligned.
- To stop infrastructure without deleting persisted data, run `docker compose stop`.

Do not use `docker compose down -v` unless you intentionally want to delete local PostgreSQL and Redis data.

## Articles and SEO/GEO

Platform admins can upload reviewed Markdown at `/admin/articles`. Source-ready
articles and the frontmatter format are in [`content/articles`](./content/articles).
Only `PUBLISHED` records appear under `/insight`, `/sitemap.xml`, `/feed.xml`,
and `/llms.txt`. Article changes are persisted in PostgreSQL and audited.
