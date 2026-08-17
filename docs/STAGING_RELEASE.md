# TemuClient V1 Staging Release and Production Approval

This is the controlled release activity after Phase 10. It is not Phase 11 and
does not authorize continued product development.

## Current decision — 2026-08-17

| Gate | Decision | Evidence |
|---|---|---|
| Production artifact | PASS | Standalone Docker image builds as a non-root runtime |
| Clean database migration | PASS | All 14 committed migrations applied in an isolated PostgreSQL 16 database |
| Local release rehearsal | PASS | App, PostgreSQL, and Redis healthy; liveness and readiness returned success |
| Seed isolation | PASS | Clean rehearsal database contained zero users before an explicit smoke registration |
| Public staging deployment | BLOCKED | Google Cloud Run profile and build configuration are prepared, but no GCP project/credential, DNS/TLS, or managed service endpoints are configured |
| Production launch | NOT APPROVED | Public staging evidence and named human approvers are still missing |

The local rehearsal uses `mock` storage, log-only email, sandbox billing, and
plain HTTP. It proves artifact portability and migration order only; it is not a
substitute for production-equivalent public staging.

## Required infrastructure inputs

Before public staging deployment, the release owner must provide:

- an immutable Git revision and hosting/container target;
- staging DNS and valid HTTPS/TLS termination;
- managed PostgreSQL with backups/PITR and a dedicated staging database;
- private Redis with authentication/TLS where supported;
- a private S3-compatible bucket and restricted staging credentials;
- a verified transactional email sender and staging API key;
- centralized structured logs, a working error-tracking destination, alerting,
  and an assigned on-call recipient;
- explicit billing mode and webhook endpoint/secret;
- names for engineering, product, security/privacy, and operations approvers.

Do not place secret values in Git, build arguments, screenshots, logs, or this
approval record. Configure them in the deployment platform's secret store.

## Controlled deployment procedure

1. Create an immutable reviewed release revision and record its identifier.
2. Copy `.env.staging.example` into the platform secret/configuration system,
   replace every example value, then run `npm run staging:preflight` in the
   release environment.
3. Build the `runtime` target from `Dockerfile` once. Promote the same image
   digest through staging and production; do not rebuild between environments.
4. Record a database backup identifier. Run the `migration` image once with
   `npm run db:migrate:deploy` before starting the application image.
5. Verify `/api/v1/health/live` and `/api/v1/health/ready` through public HTTPS.
6. Verify security headers, private storage, email delivery, rate-limit
   fail-closed behavior, logging/error alerts, and the absence of demo accounts.
7. Execute every scenario in `docs/LAUNCH_CHECKLIST.md` and attach evidence.
8. Exercise the application rollback and database restore procedures. Record
   observed RTO/RPO.
9. Hold a go/no-go review. Production deployment requires all named approvers.
10. After go-live, observe health, errors, and latency for at least 30 minutes;
    rollback on any declared stop condition.

## Formal approval record

Complete this record only after the checklist is fully evidenced:

```text
Release revision:
Container image digest:
Staging URL:
Staging deployment timestamp (UTC):
Database migration result:
Backup/restore evidence:
Buyer E2E evidence:
Provider E2E evidence:
Admin E2E evidence:
Security/privacy evidence:
Observability/alert evidence:
Rollback drill evidence:

Engineering approver / timestamp:
Product approver / timestamp:
Security or privacy approver / timestamp:
Operations approver / timestamp:

Decision: GO / NO-GO
Approved production window:
Rollback owner:
Post-launch observer:
```

An automated check may supply evidence, but it may not populate approver names
or change `NO-GO` to `GO`. There is no automatic Phase 11.
