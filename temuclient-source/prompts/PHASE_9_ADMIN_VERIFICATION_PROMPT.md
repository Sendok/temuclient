# TemuClient V1 — Phase 9 Admin & Verification


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

Create the trust and moderation layer required for a credible B2B marketplace.

# REQUIRED DATA MODELS

Implement or complete:

```text
Verification
AuditLog
Review if included in current V1 scope
```

# VERIFICATION TYPES

```text
COMPANY
DOMAIN
CONTACT
REQUIREMENT
BUDGET
DECISION_MAKER
```

Statuses:
```text
PENDING
VERIFIED
REJECTED
EXPIRED
```

# ORGANIZATION VERIFICATION UX

Route:

```text
/app/company/verification
```

Show:
- Company
- Domain
- Business Email
- Business Documents
- Advanced Verification where applicable.

Trust-oriented UX, not bureaucratic clutter.

# OPPORTUNITY VERIFICATION

Buyer opportunity can show:
- Company Verified
- Contact Verified
- Requirement Verified
- Budget Confirmed
- Decision Maker Confirmed.

Do not represent all verification as one boolean.

# ADMIN SHELL

Prefix:

```text
/admin
```

Navigation:
```text
Overview
Users
Companies
Opportunities
Verification
Reports
Subscriptions
Taxonomy
Audit Logs
```

# ADMIN DASHBOARD

Show actual:
- pending verification;
- flagged opportunities;
- active opportunities;
- buyer/provider counts;
- recent moderation actions.

# ADMIN COMPANY DETAIL

Route:

```text
/admin/companies/[id]
```

Sections:
- company;
- members;
- verification;
- services;
- portfolio;
- activity;
- flags.

Actions:
```text
Verify
Reject
Request Information
Suspend
```

# ADMIN OPPORTUNITY REVIEW

Route:

```text
/admin/opportunities/[id]
```

Show:
- buyer;
- company;
- requirement;
- budget;
- timeline;
- contact;
- verification;
- risk flags;
- history.

Actions:
```text
Verify
Reject
Request Information
Flag
```

# AUDIT LOG

All sensitive admin mutations must capture:
- actor;
- organization if relevant;
- action;
- entity type/id;
- before/after;
- metadata;
- IP/user-agent where available;
- timestamp.

Audit log is read-only.

# SUSPENSION

Suspended organizations:
- cannot perform new commercial mutations;
- existing data remains;
- admin access remains for review;
- user-facing message is clear.

# FRAUD / RISK FOUNDATION

Create lightweight signals:
- duplicate submissions;
- suspicious domain mismatch;
- repeated rejected verification;
- account status;
- manual flags.

Do not build complex ML fraud detection in V1.

# REQUIRED APIs

```text
GET /api/v1/verifications
POST /api/v1/verifications/request

GET /api/v1/admin/users
GET /api/v1/admin/organizations
GET /api/v1/admin/organizations/:id
POST /api/v1/admin/organizations/:id/suspend

GET /api/v1/admin/opportunities
GET /api/v1/admin/opportunities/:id
POST /api/v1/admin/opportunities/:id/flag

GET /api/v1/admin/verifications
POST /api/v1/admin/verifications/:id/approve
POST /api/v1/admin/verifications/:id/reject

GET /api/v1/admin/audit-logs
```

# PLATFORM RBAC

Implement:
```text
SUPER_ADMIN
ADMIN
MODERATOR
```

Do not mix platform admin role with organization role.

# TESTS

Unit:
- platform RBAC;
- verification status rules;
- suspension rules.

Integration:
- request verification;
- approve;
- reject;
- suspend;
- audit record;
- unauthorized admin endpoint denial.

E2E:
```text
Provider requests verification
→ Admin sees queue
→ Admin approves
→ Provider sees Verified
```

# ACCEPTANCE CRITERIA

```text
verification is independent by type
admin actions audited
platform RBAC works
suspension enforced server-side
verification visible in core product
moderation data is real
```


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
TemuClient V1 — Phase 9 Admin & Verification

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
