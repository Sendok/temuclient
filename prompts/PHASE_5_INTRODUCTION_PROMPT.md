# TemuClient V1 — Phase 5 Introduction


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

Turn a qualified match into a trusted business connection.

Target:

```text
Provider sees match
→ Request Introduction
→ Buyer reviews Provider
→ Accept / Decline
→ Accepted connection unlocks approved context
```

# REQUIRED DATA MODEL

Implement or complete:

```text
Introduction
```

Statuses:

```text
REQUESTED
ACCEPTED
DECLINED
CANCELLED
EXPIRED
```

# PROVIDER REQUEST FLOW

From opportunity detail:

```text
Request Introduction
```

Form:
- relevant portfolio;
- fit summary;
- proposed approach;
- estimated timeline;
- short message.

AI assist is optional for drafting only.

Never auto-submit AI content.

# DUPLICATE RULE

Block duplicate active requests for:

```text
opportunityId + providerOrganizationId
```

# BUYER INTRODUCTION INBOX

Route:

```text
/app/introductions
```

Buyer can:
- review provider;
- open provider profile;
- inspect Match Score;
- inspect relevant portfolio;
- accept;
- decline.

# ACCEPT TRANSACTION

Accept must execute transactionally:

```text
validate REQUESTED
→ set ACCEPTED
→ acceptedBy
→ acceptedAt
→ create Conversation
→ create ConversationParticipants
→ optionally initialize Deal according to current architecture
→ create AuditLog
→ emit IntroductionAccepted
→ notify provider
```

Make the operation idempotent.

# PRIVACY UNLOCK

Only after ACCEPTED may authorized participants receive approved direct business contact context.

Even after acceptance:
- limit data to involved organizations/users;
- do not expose unrelated private organization data.

# DECLINE

Allow optional reason.

Do not reveal internal buyer notes to provider.

# PROVIDER INTRODUCTION LIST

Tabs:

```text
All
Pending
Accepted
Declined
```

Show:
- opportunity;
- status;
- date;
- next action.

# REQUIRED APIs

```text
POST /api/v1/opportunities/:id/introductions
GET /api/v1/introductions
GET /api/v1/introductions/:id
POST /api/v1/introductions/:id/accept
POST /api/v1/introductions/:id/decline
POST /api/v1/introductions/:id/cancel
```

# DOMAIN EVENTS

At least:

```text
IntroductionRequested
IntroductionAccepted
IntroductionDeclined
```

# TESTS

Unit:
- state transitions;
- duplicate rules;
- permission rules.

Integration:
- provider request;
- buyer accept;
- buyer decline;
- provider cancel;
- idempotent accept;
- transaction rollback;
- privacy before/after acceptance.

E2E:
```text
Provider
→ Opportunity
→ Request Introduction

Buyer
→ Review
→ Accept

Provider
→ Sees Accepted
```

# ACCEPTANCE CRITERIA

```text
introduction state machine works
duplicate active request blocked
accept is transactional
privacy unlock is server-side
notifications/events created
buyer/provider access isolated
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
TemuClient V1 — Phase 5 Introduction

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
