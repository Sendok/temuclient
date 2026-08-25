# TemuClient V1 — Phase 4 Matching Engine


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

Connect Buyer Opportunities with Provider capabilities through deterministic matching.

Target:

```text
Buyer publishes Opportunity
→ Provider candidates selected
→ Match Score calculated
→ Ranked matches stored
→ Provider sees Opportunity Feed
→ Buyer sees Provider Matches
```

# REQUIRED DATA MODELS

Implement or complete:

```text
OpportunityMatch
SavedOpportunity
```

Add matching-related provider capability fields if missing.

# MATCHING ENGINE

Create domain interface:

```ts
interface MatchingEngine {
  calculate(
    opportunity: OpportunityProfile,
    provider: ProviderProfile
  ): Promise<MatchResult>
}
```

Weights:

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

Total = 100.

Store:
- factor scores;
- total score;
- reason codes/explanations;
- algorithmVersion;
- calculatedAt.

# IMPORTANT RULE

AI must NOT decide the core V1 Match Score.

AI may generate human-friendly explanation from deterministic score inputs.

# CANDIDATE SELECTION

Do not score every provider blindly if simple candidate filtering can reduce the set.

Filter first on:
- active provider;
- relevant service;
- viable project range where available.

Then score.

# MATCH RECALCULATION

Recalculate when meaningful fields change:

Opportunity:
- service;
- industry;
- budget;
- requirements;
- location;
- timeline.

Provider:
- services;
- industries;
- project range;
- portfolio;
- technology;
- capacity;
- availability.

Use queue-ready architecture.

# PROVIDER OPPORTUNITY FEED

Route:

```text
/app/opportunities
```

Implement:
- search;
- filters;
- sorting;
- comfortable/compact view if practical;
- cursor pagination.

Filters:
```text
industry
service
budget
city
intent
verification
match
project type
```

Default sort:
1. match;
2. intent;
3. recency.

# OPPORTUNITY DETAIL

Route:

```text
/app/opportunities/[id]
```

Show:
- safe overview;
- problem;
- objectives;
- requirements;
- timeline;
- budget;
- location;
- Match Score;
- Buyer Intent;
- verification summary;
- why matched;
- expiry.

CTA:
- Save.

Do not implement Introduction yet except disabled/next-phase affordance if necessary.

# PRIVACY GATE

Provider MUST NOT receive before accepted Introduction:

```text
buyer direct email
buyer phone
decision-maker personal contact
private attachments
hidden buyer identity
```

Implement provider-safe DTO projection.

Add explicit tests that sensitive fields are absent from serialized responses.

# BUYER PROVIDER MATCHES

Implement:

```text
/app/requirements/[id]/matches
/app/providers/[id]
/app/requirements/[id]/compare
```

Buyer sees:
- provider identity;
- verification;
- services;
- relevant portfolio;
- project range;
- location;
- Match Score;
- factor summary.

Compare max 3 providers.

# SAVE OPPORTUNITY

Implement idempotent save/unsave.

# SEED SCENARIO

Ensure deterministic dev scenario:

```text
PT Nusantara Logistik
Warehouse Management System
Rp250–400 juta
```

Providers:
```text
Sagara Software      strongest
Nusa Systems         medium-high
Orbit Teknologi      moderate
```

Exact numbers depend on implemented factor math, but relative ranking should be deterministic.

# REQUIRED APIs

```text
GET /api/v1/opportunity-feed
GET /api/v1/opportunity-feed/:id
GET /api/v1/opportunities/:id/matches

POST /api/v1/opportunities/:id/save
DELETE /api/v1/opportunities/:id/save
```

# TESTS

Unit:
- each score factor;
- total score;
- algorithm version;
- candidate filtering.

Integration:
- publish triggers match generation;
- provider feed ordering;
- save/unsave;
- buyer match access;
- provider privacy projection.

E2E:
```text
Buyer publishes
→ Provider logs in
→ sees ranked opportunity
→ opens detail
→ Buyer sees ranked providers
```

# ACCEPTANCE CRITERIA

```text
deterministic matching works
rankings persist
provider feed uses actual match data
buyer matches use actual match data
privacy tests pass
no AI-dependent core score
pagination/filtering works
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
TemuClient V1 — Phase 4 Matching Engine

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
