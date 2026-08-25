# TemuClient V1 Production Runbook

## Release topology

TemuClient is a Next.js 16 modular monolith behind an HTTPS CDN/load balancer,
with managed PostgreSQL, Redis, private S3-compatible storage, transactional
email, analytics, and an optional AI provider. DNS and TLS terminate at the
platform edge. Origin access should be restricted to that edge where possible.

## Build and deploy

1. Create an immutable release from a reviewed commit.
2. Run `npm ci`, `npm run db:generate`, lint, typecheck, tests, and build in CI.
3. Back up PostgreSQL and record the backup identifier.
4. Run `npm run db:migrate:deploy` once from a migration job.
5. Deploy the artifact with `npm run start`; never run `prisma migrate dev`.
6. Check `/api/v1/health/live` and `/api/v1/health/ready`.
7. Execute the launch smoke checklist and observe errors/latency for 30 minutes.

The repository provides a vendor-neutral standalone `Dockerfile`. Run
`npm run staging:preflight` against public staging configuration before a
deployment. `docker-compose.release.yml` is an isolated local artifact rehearsal
only and must not be used as public staging or production infrastructure. The
controlled staging procedure and approval record are in `STAGING_RELEASE.md`.
The Google Cloud implementation profiles use Cloud Run, Artifact Registry,
Cloud Build, Secret Manager, managed Redis/storage choices, and either Cloud SQL
or Neon PostgreSQL. See `GOOGLE_CLOUD_DEPLOYMENT.md` for Cloud SQL and
`GOOGLE_CLOUD_NEON_DEPLOYMENT.md` for the cost-optimized Neon profile.

`prisma/seed.ts` is development/test data only. Never run it in production.
All example accounts and passwords must be absent from the production database.
Create the first platform administrator only with the controlled
`admin:bootstrap` job in `GOOGLE_CLOUD_DEPLOYMENT.md`; it records an audit entry
and refuses to create a second platform administrator. Import reviewed Markdown
content with the separate `articles:import` job after that administrator exists.

## Environment

Use `NODE_ENV=production` and `APP_ENV=staging|production`. Production validation
requires HTTPS, a non-example auth secret, live S3, transactional email, and a
billing webhook secret. Select billing explicitly: `sandbox` means no real
payment; `midtrans` enables QRIS and requires an approved monthly price, server
key, signed notification endpoint, and `MIDTRANS_IS_PRODUCTION=true` before
production payments are allowed.

## Database migration and rollback

Migrations are forward-only. Before deploy, inspect SQL for locks, destructive
changes, and backfill cost. Use expand/migrate/contract for breaking changes.
Application rollback is allowed only while the previous version supports the
new schema. Do not manually delete a migration row. When schema rollback is
unavoidable, restore the pre-release backup into a new database, verify it, and
switch the application during a declared maintenance window.

## Backup and restore

- Managed PostgreSQL: daily snapshot, point-in-time recovery, 30-day retention;
  cross-region copy for production.
- S3: versioning and lifecycle rules; incomplete multipart uploads expire after
  7 days, rejected/unreferenced uploads after 24 hours, retained commercial
  documents follow the contractual retention period.
- Redis is not source of truth and does not need business-state recovery.

Quarterly restore drill:

1. Restore the newest snapshot into an isolated network/database.
2. Run `prisma migrate status` and read-only integrity queries.
3. Start a staging application against the restored database.
4. Execute Buyer, Provider, and Admin smoke scenarios.
5. Record RPO/RTO and destroy the isolated copy securely.

## Incident triage

1. Declare severity, incident commander, and communication channel.
2. Capture request ID, UTC time, actor/entity IDs, release, and symptoms—never
   passwords, tokens, prompts, message bodies, or private file content.
3. Check readiness, structured errors, database saturation, Redis, email,
   storage, billing webhooks, and AI execution failures.
4. Contain: suspend affected organization, revoke sessions, disable provider,
   or roll back application as appropriate.
5. Preserve audit/event records and produce a post-incident review.

## Operational actions

- Suspend organization: Admin Console → Company → Suspend. It is audited and
  blocks commercial mutations while retaining review access.
- Revoke session: delete the target user's `Session` records through an audited
  support procedure; reset-password already revokes all sessions.
- Gemini outage: switch to `AI_PROVIDER=deterministic`, redeploy, and keep generated
  content review-only.
- Email outage: keep in-app notifications active, queue/retry externally, never
  log tokenized URLs, and restore the provider before expiring token windows.
- Redis outage: authentication remains database-backed. In production the rate
  limiter should fail closed (`RATE_LIMIT_FAIL_OPEN=false`); restore Redis or
  explicitly approve temporary degradation.
- Storage outage: stop signing new uploads; existing metadata remains readable.
- Billing webhook failure: retry the same provider event ID. Idempotency ensures
  it is processed once. Do not manually grant plans without an audit record.

## Performance and monitoring

Alert on readiness failures, HTTP 5xx, rate-limit anomalies, database pool
saturation, webhook failures, AI failures, and P95 latency. Targets: initial
page under 2.5s, common API P95 under 500ms excluding external/AI calls, and
search under 1s. Measure before tuning; inspect query plans for feed/admin paths.
