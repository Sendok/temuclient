# AGENTS.md — TemuClient Engineering Instructions

**Product:** TemuClient  
**Version:** 1.0  
**Purpose:** Permanent operating rules for coding agents working in this repository.

---

## 1. Product Context

TemuClient is a **Verified B2B Opportunity Network**.

Core product loop:

```text
Need
→ Qualification
→ Match
→ Introduction
→ Meeting
→ Deal
```

TemuClient is NOT:

- a freelance marketplace;
- a job marketplace;
- a generic CRM;
- a contact database;
- a WhatsApp blast tool;
- an email marketing platform;
- a bidding marketplace.

The primary product outcome is:

> A provider can quickly understand which companies genuinely need what they sell, why they are a strong match, and what action to take next.

For buyers:

> A buyer can describe a business problem, receive a small number of credible provider matches, and move efficiently into a business discussion.

---

## 2. Source of Truth

Before changing architecture, domain entities, routes, APIs, permissions, or major UI patterns, read the relevant files under `/docs`.

Required source-of-truth documents:

```text
/docs/DESIGN_SYSTEM.md
/docs/SYSTEM_DESIGN.md
/docs/DATABASE_SCHEMA.md
/docs/API_CONTRACT.md
/docs/USER_FLOWS.md
/docs/SCREEN_SPECIFICATIONS.md
```

If implementation requires a product or architecture change, update the relevant documentation in the same change.

Never let implementation silently diverge from `/docs`.

---

## 3. Core Engineering Rules

1. Do not invent new domain terminology when an existing term already exists.
2. Do not rename core entities without updating all affected documentation.
3. Do not create database models that conflict with `DATABASE_SCHEMA.md`.
4. Do not create API endpoints that conflict with `API_CONTRACT.md`.
5. Do not expose buyer private information before an Introduction is `ACCEPTED`.
6. Do not place major business logic inside React components.
7. All mutations require server-side authorization.
8. Client-side hiding is never sufficient for authorization.
9. Use TypeScript strict mode.
10. Use Zod validation for input and structured AI output.
11. Use PostgreSQL as source of truth for commercial state.
12. Use Redis only for cache, coordination, rate limits, and queue-related concerns.
13. Use deterministic Match Score logic for V1.
14. AI may explain scores but must not decide the core V1 Match Score.
15. AI-generated text must never be auto-sent without user review.
16. Every important mutation must enforce valid state transitions.
17. Critical business workflows should be transactional.
18. Every admin mutation must create an audit record.
19. Do not add non-functional UI controls and call them complete.
20. Do not replace working modules unnecessarily.

---

## 4. Technical Baseline

Use:

```text
Next.js 16
App Router
TypeScript strict
Tailwind CSS
shadcn/ui
React Hook Form
Zod
TanStack Query
TanStack Table
PostgreSQL
Prisma ORM
Redis
S3-compatible storage
```

Architecture:

```text
Modular Monolith
```

Do not introduce microservices in V1 without a concrete requirement.

---

## 5. Required Layering

For important features, preserve this flow:

```text
UI
↓
Validation
↓
Authorization
↓
Domain Service
↓
Repository / Database
↓
Domain Event / Audit where relevant
↓
Notification where relevant
```

Do not skip domain rules by writing directly to Prisma from arbitrary UI components.

---

## 6. Suggested Module Structure

```text
src/
  app/
  components/
  modules/
  server/
  lib/

prisma/
  schema.prisma
  seed.ts

tests/
  unit/
  integration/
  e2e/

docs/
```

Domain modules may contain:

```text
types.ts
schema.ts
validators.ts
permissions.ts
repository.ts
service.ts
events.ts
api.ts
```

Use only what is useful; avoid unnecessary abstraction.

---

## 7. UI Rules

Follow `DESIGN_SYSTEM.md`.

Design direction:

- elegant;
- premium;
- calm;
- modern;
- enterprise-ready;
- neutral-first;
- information-dense but readable.

Avoid:

- excessive gradients;
- excessive rounded cards;
- crypto/neon styling;
- generic CRM visual clutter;
- oversized headings inside the app;
- empty decorative dashboards.

Every completed major screen must include:

```text
loading state
empty state
error state
permission state
mobile behavior
```

Use reusable components.

Do not create several page-specific versions of the same component if variants are sufficient.

---

## 8. Privacy Rules

Before Introduction `ACCEPTED`, providers must not receive:

```text
buyer direct email
buyer phone number
private buyer contact
private decision-maker identity
private attachments
hidden buyer organization identity
```

Enforce privacy in server-side DTO/query projections.

Never fetch sensitive data and rely on CSS or frontend conditions to hide it.

---

## 9. RBAC Rules

Organization roles:

```text
OWNER
ADMIN
SALES
MEMBER
```

Platform roles:

```text
SUPER_ADMIN
ADMIN
MODERATOR
```

Every protected service should verify:

```text
authenticated user
organization membership
organization role
entity relationship
entity state
```

Tenant isolation must be tested.

---

## 10. State Machines

### Opportunity

```text
DRAFT
→ REVIEW
→ ACTIVE
→ MATCHING
→ IN_DISCUSSION
→ WON
```

Alternative states:

```text
PAUSED
CANCELLED
EXPIRED
```

### Introduction

```text
REQUESTED
→ ACCEPTED

REQUESTED
→ DECLINED

REQUESTED
→ CANCELLED

REQUESTED
→ EXPIRED
```

### Deal

```text
INTRODUCTION
→ DISCOVERY
→ PROPOSAL
→ NEGOTIATION
→ WON
```

Any active deal may become:

```text
LOST
```

Invalid transitions must be rejected server-side.

---

## 11. Matching Rules

Use deterministic weighted matching for V1.

```text
Service Compatibility      25
Industry Experience        15
Budget Compatibility       15
Portfolio Relevance        15
Technology Capability      10
Company Capacity           10
Location                    5
Availability                5
```

Store:

```text
factor scores
total score
algorithm version
reasons
calculated timestamp
```

Do not silently change weights without updating documentation and tests.

---

## 12. AI Rules

All AI features must:

- use a provider abstraction;
- validate structured output;
- log execution metadata;
- enforce authorization;
- enforce plan/rate limits;
- never autonomously send outreach;
- avoid storing unnecessary sensitive prompt content.

Initial approved AI use cases:

```text
Requirement Builder
Opportunity Summary
Match Explanation
Meeting Preparation
Discovery Analysis
Follow-Up Draft
Proposal Outline
Deal Health
```

---

## 13. Database Rules

- Use PostgreSQL.
- Use Prisma migrations.
- Use proper foreign keys and indexes.
- Do not use float for money.
- Use BigInt for IDR if fractional rupiah is not required.
- Store timestamps in UTC.
- Display using user timezone.
- Initial default timezone: `Asia/Jakarta`.
- Do not add `deletedAt` to every table by default.
- Audit history and credit ledgers should be immutable.

---

## 14. API Rules

Base API path:

```text
/api/v1
```

Success:

```json
{
  "data": {},
  "meta": {}
}
```

Errors:

```json
{
  "error": {
    "code": "DOMAIN_ERROR_CODE",
    "message": "Human readable message.",
    "fieldErrors": {}
  }
}
```

Never expose internal stack traces.

---

## 15. Testing Rules

Minimum unit tests:

```text
RBAC
tenant isolation
matching score
buyer intent score
state transitions
privacy projections
```

Minimum integration tests:

```text
publish opportunity
request introduction
accept introduction
create conversation
schedule meeting
move deal stage
```

Minimum E2E flows:

### Buyer

```text
Register
→ Choose Buyer
→ Create Company
→ Create Requirement
→ Publish
→ View Matches
→ Accept Introduction
```

### Provider

```text
Register
→ Choose Provider
→ Create Company
→ Add Services
→ View Opportunity
→ Request Introduction
→ Message
→ Meeting
→ Deal
```

---

## 16. Required Validation Before Completion

Before saying a phase is complete, run:

```text
lint
typecheck
unit tests
integration tests
build
```

Run E2E where the phase has an E2E acceptance flow.

Do not claim success if commands fail.

If a command cannot be run, state exactly why.

---

## 17. Change Discipline

Before coding a feature:

1. Read relevant `/docs`.
2. Inspect the existing implementation.
3. Identify reusable code.
4. Identify required migration.
5. State the implementation plan.
6. Implement vertically.
7. Add tests.
8. Run validation commands.
9. Report what changed.

Avoid broad refactors unrelated to the current phase.

---

## 18. Implementation Report

At the end of every development phase, return:

```text
IMPLEMENTATION REPORT

Completed:
-

Not completed:
-

Changed files:
-

Database migration:
-

New API:
-

New routes:
-

Tests added:
-

Commands executed:
-

Build result:
-

Known issues:
-

Recommended next phase:
-
```

Never describe a feature as complete if it is a visual stub only.

---

## 19. Product Scope Discipline

V1 explicitly excludes:

```text
WhatsApp automation
mass email sequences
contact scraping
LinkedIn scraping
full CRM
accounting
invoice management
escrow
tender bidding
success-fee settlement
external Opportunity Radar
automated AI SDR
```

Do not add these unless requirements explicitly change.

---

## 20. Definition of Engineering Quality

A feature is complete only when:

```text
UI works
data persists
authorization works
validation works
state transition is valid
error states exist
tests exist
build passes
```

TemuClient should be developed as a real B2B product, not as a collection of disconnected screens.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
