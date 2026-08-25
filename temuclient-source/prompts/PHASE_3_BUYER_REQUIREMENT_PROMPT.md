# TemuClient V1 — Phase 3 Buyer Requirement


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

Allow a Buyer to describe a real business problem and publish it as a structured Opportunity.

Target flow:

```text
Buyer Login
→ New Requirement
→ Describe Need
→ Clarify
→ Structured Requirement
→ Review
→ Publish
→ Opportunity ACTIVE
```

Do not implement Matching yet.

# REQUIRED DATA MODELS

Implement or complete:

```text
Opportunity
OpportunityRequirement
OpportunityAttachment
Verification foundation
```

Add all fields defined in `DATABASE_SCHEMA.md`.

# OPPORTUNITY STATES

Implement and validate:

```text
DRAFT
REVIEW
ACTIVE
PAUSED
MATCHING
IN_DISCUSSION
WON
CANCELLED
EXPIRED
```

For this phase, primary used states:

```text
DRAFT
REVIEW
ACTIVE
PAUSED
CANCELLED
EXPIRED
```

Reject invalid transitions server-side.

# BUYER REQUIREMENT UI

Implement:

```text
/app/requirements
/app/requirements/new
/app/requirements/[id]/review
/app/requirements/[id]
```

# NEW REQUIREMENT EXPERIENCE

Start with:

```text
Apa yang perusahaan Anda butuhkan?
```

Textarea example:

```text
Kami membutuhkan sistem untuk mengelola inventory di 5 warehouse...
```

CTA:

```text
Mulai
```

Do not start with a huge technical form.

# STRUCTURED REQUIREMENT

Support:

```text
title
business objective
problem statement
description
service category
industry
project type
requirements
budget min/max
budget status
timeline
location
remote allowed
provider preference
attachments
```

# AI REQUIREMENT BUILDER FOUNDATION

Create AI provider abstraction if not already available.

Implement:

```text
analyze
questions
structure
```

Requirements:
- structured output validated with Zod;
- AI never auto-publishes;
- user always reviews before save/publish;
- graceful fallback when no API key is configured.

If AI provider is unavailable, the product must still work using structured manual editing.

# BUYER INTENT SCORE V1

Implement deterministic scoring:

```text
Requirement Completeness  20
Budget                    20
Timeline                  15
Decision Maker            15
Company Verification      10
Activity                  10
Urgency                   10
```

Store:
- score;
- level;
- algorithm version;
- calculated timestamp if schema supports it.

Intent levels:

```text
0–39   LOW
40–59  MEDIUM
60–79  HIGH
80–100 VERY_HIGH
```

# PUBLISH VALIDATION

An Opportunity cannot publish unless minimum required fields are valid.

At minimum validate:
- title;
- service;
- industry;
- problem;
- project type;
- location/country;
- buyer organization;
- no blocking account state.

# ATTACHMENTS

Implement safe metadata and upload foundation:
- allowed MIME validation;
- max size;
- visibility;
- signed upload architecture if storage is configured.

Do not expose private attachments to unrelated providers.

# BUYER DASHBOARD

Show actual:
- active requirements;
- draft requirements;
- recent requirement status;
- CTA to create requirement.

Do not show fake provider match counts yet.

# REQUIRED APIs

Implement docs-aligned endpoints:

```text
POST /api/v1/opportunities
GET /api/v1/opportunities/:id
PATCH /api/v1/opportunities/:id
POST /api/v1/opportunities/:id/publish
POST /api/v1/opportunities/:id/pause
POST /api/v1/opportunities/:id/cancel
POST /api/v1/opportunities/:id/extend

POST /api/v1/ai/requirements/analyze
POST /api/v1/ai/requirements/questions
POST /api/v1/ai/requirements/structure
```

# TESTS

Unit:
- buyer intent score;
- state transitions;
- publish validation.

Integration:
- create draft;
- edit;
- publish;
- pause;
- cancel;
- cross-tenant access denial;
- attachment privacy.

E2E:
```text
Buyer Login
→ Create Requirement
→ Review
→ Publish
→ ACTIVE
```

# ACCEPTANCE CRITERIA

```text
buyer can create/edit draft
buyer can review
buyer can publish
state transitions are enforced
intent score is deterministic
data persists
AI is optional, not blocking
private data remains protected
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
TemuClient V1 — Phase 3 Buyer Requirement

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
