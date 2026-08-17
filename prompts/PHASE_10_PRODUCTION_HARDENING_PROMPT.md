# TemuClient V1 — Phase 10 Production Hardening


Before making any code changes:

1. Read `/AGENTS.md`.
2. Read `/MASTER_DEVELOPMENT_PLAN.md`.
3. Read all relevant files under `/docs`:
   - `DESIGN_SYSTEM.md`
   - `SYSTEM_DESIGN.md`
   - `DATABASE_SCHEMA.md`
   - `API_CONTRACT.md`
   - `USER_FLOWS.md`
   - `SCREEN_SPECIFICATIONS.md`
4. Inspect the current repository and implementation.
5. Reuse working code where appropriate.
6. Do not rewrite unrelated modules.
7. Produce a concise implementation plan before coding.
8. Implement vertically:
   UI → Validation → Authorization → Domain Service → Database → Events/Audit → Tests.
9. Keep all product terminology consistent with the docs.
10. Do not claim completion unless required checks pass.

TemuClient core loop:

```text
Need → Match → Introduction → Meeting → Deal
```


# PHASE GOAL

Prepare TemuClient V1 for controlled production launch with real users and real business data.

This phase prioritizes reliability, security, observability, billing foundation, analytics, deployment, and operational readiness over new feature breadth.

# 1. PRODUCTION SECURITY

Review and harden:

```text
session security
cookie flags
CSRF protections where relevant
rate limiting
input validation
authorization
tenant isolation
security headers
XSS safety
upload MIME validation
upload size limits
signed private file access
password reset security
admin endpoint protection
AI rate limits
```

Add explicit tests for privacy boundaries.

# 2. ENVIRONMENT VALIDATION

Implement typed environment validation.

Separate:

```text
development
test
staging
production
```

No production app should boot with critical secrets missing.

Create complete:

```text
.env.example
```

# 3. DATABASE PRODUCTION READINESS

Review:
- migrations;
- indexes;
- transaction boundaries;
- connection pooling;
- backup;
- restore procedure;
- migration rollback/forward strategy;
- seed separation from production.

Document backup and restore.

# 4. REDIS

Productionize:
- connection;
- rate limits;
- cache TTL;
- graceful failure;
- namespaced keys.

# 5. FILE STORAGE

Productionize S3-compatible storage:
- signed uploads;
- private objects;
- signed downloads;
- content type;
- size limits;
- storage key strategy;
- cleanup policy.

# 6. EMAIL

Configure transactional email provider abstraction.

Required templates:
```text
verification
password reset
introduction accepted
meeting scheduled
important account/security notification
```

Avoid marketing email automation.

# 7. BILLING FOUNDATION

Provider plans:

```text
FREE
PRO
BUSINESS
```

Implement:
- Subscription model;
- plan resolver;
- feature entitlement checks;
- provider abstraction for billing;
- webhook idempotency;
- billing settings UI.

If actual payment provider is not configured, keep billing integration clearly in sandbox/mock mode.

Do not pretend real payments work if they do not.

# 8. PLAN ENTITLEMENTS

Create centralized feature limits.

Examples:
```text
opportunity access
AI request quota
team seats
advanced analytics
priority matching
```

Do not scatter plan checks across components.

# 9. ANALYTICS

North Star:

```text
Qualified Introductions per Month
```

Track funnel:

```text
Opportunity Published
→ Match
→ Introduction Requested
→ Introduction Accepted
→ Meeting
→ Proposal
→ Deal Won
```

Events:
```text
user_registered
role_selected
organization_created
provider_profile_completed
opportunity_created
opportunity_published
opportunity_viewed
opportunity_saved
introduction_requested
introduction_accepted
message_sent
meeting_created
proposal_submitted
deal_won
deal_lost
```

Use a provider abstraction if external analytics is configured.

# 10. OBSERVABILITY

Implement:
- structured logs;
- request IDs;
- error tracking integration point;
- performance timing;
- AI execution logs;
- audit logs;
- health endpoint.

Never log secrets.

# 11. HEALTH CHECKS

Create production health/readiness endpoints as appropriate.

Check:
- app;
- database;
- Redis.

Do not expose sensitive details publicly.

# 12. CI/CD

Create/update CI to run:
```text
install
lint
typecheck
unit tests
integration tests
build
```

Run E2E against staging if infrastructure supports it.

Deploy only after required checks pass.

# 13. PRODUCTION DEPLOYMENT

Document:
- build command;
- start command;
- environment;
- migration process;
- rollback process;
- DNS/SSL assumptions;
- CDN;
- storage;
- email;
- database;
- Redis.

# 14. E2E LAUNCH TEST

Automate or document an executable smoke test:

Buyer:
```text
register
→ company
→ requirement
→ publish
→ view matches
→ accept introduction
→ message
→ meeting
```

Provider:
```text
register
→ profile
→ match
→ request introduction
→ accepted
→ message
→ meeting
→ deal
→ proposal
→ won/lost
```

Admin:
```text
verify company
→ verify opportunity
→ inspect audit
```

# 15. PERFORMANCE

Review:
- N+1 queries;
- feed queries;
- indexes;
- page payloads;
- image optimization;
- caching;
- pagination.

Targets:
```text
initial page < 2.5s target
common API P95 < 500ms excluding AI/external
search < 1s
```

Do not optimize blindly; measure first.

# 16. PRIVACY AUDIT

Explicitly test that providers cannot access before accepted Introduction:

```text
buyer direct email
buyer phone
decision maker contact
private attachments
hidden buyer identity
```

Check:
- APIs;
- Server Components;
- serialized page data;
- logs;
- error payloads.

# 17. ADMIN & OPERATIONAL RUNBOOK

Create:

```text
/docs/PRODUCTION_RUNBOOK.md
```

Include:
- deploy;
- rollback;
- database migration;
- backup restore;
- incident triage;
- suspend organization;
- revoke session;
- AI provider outage;
- email outage;
- Redis outage.

# 18. LAUNCH CHECKLIST

Create:

```text
/docs/LAUNCH_CHECKLIST.md
```

Must include:
- security;
- privacy;
- DB;
- backups;
- domain;
- SSL;
- email;
- billing mode;
- analytics;
- monitoring;
- seed accounts removed/secured;
- admin accounts secured;
- E2E passed.

# 19. REQUIRED TESTS

Unit:
- entitlement resolver;
- security helpers;
- environment validation.

Integration:
- billing webhook idempotency if enabled;
- rate limits;
- health checks;
- file privacy;
- email events.

E2E:
- full buyer/provider/admin launch scenario.

# ACCEPTANCE CRITERIA

Production-ready only when:

```text
critical security tests pass
tenant isolation passes
privacy audit passes
migrations are documented
backup/restore documented
CI passes
production build passes
health checks work
observability exists
billing mode is explicit
full E2E launch flow passes
production runbook exists
launch checklist exists
```

# IMPORTANT

Do not introduce large new product features in this phase.

Focus on making existing V1 safe, observable, testable, deployable, and operable.


# GLOBAL QUALITY REQUIREMENTS

For every completed feature:

- real persistence;
- server-side authorization;
- Zod validation;
- loading state;
- empty state;
- error state;
- mobile behavior;
- test coverage;
- no fake buttons;
- no hidden client-only authorization;
- no undocumented architecture divergence.

Before completion, detect the package manager and run equivalent commands for:

```text
lint
typecheck
unit tests
integration tests
production build
```

Run relevant E2E tests for the phase.

If a command cannot run, explain exactly why.

Do not claim completion if required commands fail.



# FINAL RESPONSE FORMAT

Return:

```text
IMPLEMENTATION REPORT

Phase:
TemuClient V1 — Phase 10 Production Hardening

Status:
COMPLETE / PARTIAL / BLOCKED

Completed:
-

Not completed:
-

Changed files:
-

Database migration:
-

New APIs / Server Actions:
-

New routes:
-

RBAC / Privacy changes:
-

Tests added:
-

Commands executed:
-

Lint result:
-

Typecheck result:
-

Test result:
-

Build result:
-

Known issues:
-

Documentation updated:
-

Recommended next phase:
-
```
