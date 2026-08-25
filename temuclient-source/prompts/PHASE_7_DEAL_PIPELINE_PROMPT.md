# TemuClient V1 — Phase 7 Deal Pipeline


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

Track a connected opportunity through discovery, proposal, negotiation, and final commercial outcome.

Target:

```text
Accepted Introduction
→ Deal
→ Discovery
→ Proposal
→ Negotiation
→ Won / Lost
```

# REQUIRED DATA MODELS

Implement or complete:

```text
Deal
DealStageHistory
DealActivity
Proposal
```

# DEAL STAGES

```text
INTRODUCTION
DISCOVERY
PROPOSAL
NEGOTIATION
WON
LOST
```

Status:

```text
OPEN
WON
LOST
```

Validate all transitions server-side.

# DEAL CREATION

Preferred:
- initialize deal when Introduction is accepted.

If architecture already creates it in Phase 5, integrate cleanly.

Do not allow unrelated manual deals without a valid TemuClient relationship.

# DEAL BOARD

Route:

```text
/app/deals
```

Views:
```text
Board
List
```

Board active columns:
```text
INTRODUCTION
DISCOVERY
PROPOSAL
NEGOTIATION
```

Closed deals through filters or separate view.

Card:
- buyer company;
- opportunity;
- estimated value;
- probability;
- last activity;
- next action.

# DRAG AND DROP

If implemented:
- client drag is only UX;
- server validates final transition;
- rollback on rejection.

# DEAL DETAIL

Route:

```text
/app/deals/[id]
```

Header:
- company;
- opportunity;
- stage;
- estimated value;
- probability.

Tabs:
```text
Overview
Activity
Messages
Meetings
Proposal
Notes
```

Actions:
```text
Add Activity
Schedule Meeting
Add Note
Create Proposal
Mark Won
Mark Lost
```

# DEAL ACTIVITY

Support:
```text
NOTE
CALL
EMAIL
MEETING
STAGE_CHANGE
PROPOSAL
SYSTEM
```

# PROPOSALS

Support versioning.

Fields:
- title;
- summary;
- amount;
- currency;
- status;
- document URL optional.

Statuses:
```text
DRAFT
SUBMITTED
ACCEPTED
REJECTED
WITHDRAWN
```

# MARK WON

Transactional:
```text
validate open deal
→ stage WON
→ status WON
→ wonAt
→ final value if provided
→ stage history
→ activity
→ analytics
→ domain event
```

# MARK LOST

Require lost reason.

# REQUIRED APIs

```text
GET /api/v1/deals
POST /api/v1/deals
GET /api/v1/deals/:id
PATCH /api/v1/deals/:id
POST /api/v1/deals/:id/stage
POST /api/v1/deals/:id/won
POST /api/v1/deals/:id/lost

GET /api/v1/deals/:id/activities
POST /api/v1/deals/:id/activities

GET /api/v1/deals/:id/proposals
POST /api/v1/deals/:id/proposals
GET /api/v1/proposals/:id
PATCH /api/v1/proposals/:id
POST /api/v1/proposals/:id/submit
```

# PERMISSIONS

Provider:
- OWNER/ADMIN manage all organization deals.
- SALES manages assigned deals.
- MEMBER read-only by default.

Buyer must not see provider internal notes unless explicitly designed as shared data.

# TESTS

Unit:
- state transitions;
- probability bounds;
- proposal version rules.

Integration:
- create deal;
- stage changes;
- stage history;
- add note;
- submit proposal;
- mark won;
- mark lost;
- permission isolation.

E2E:
```text
Accepted Introduction
→ Deal
→ Discovery
→ Proposal
→ Negotiation
→ Won
```

Also test Lost.

# ACCEPTANCE CRITERIA

```text
deal progression works
history is immutable
activities persist
proposal versions persist
won/lost are final states
internal notes remain private
board and list show real data
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
TemuClient V1 — Phase 7 Deal Pipeline

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
