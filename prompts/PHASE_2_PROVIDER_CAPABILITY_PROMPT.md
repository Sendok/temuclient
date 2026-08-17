# TemuClient V1 — Phase 2 Provider Capability


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

Allow Provider organizations to define exactly what they sell so the platform has reliable inputs for future matching.

Target flow:

```text
Provider Login
→ Company Profile
→ Services
→ Project Range
→ Industries
→ Portfolio
→ Team Capacity
→ Verification Summary
→ Profile Complete
```

Do NOT implement the full Opportunity, Matching, Introduction, Messaging, Deals, Billing, or AI Sales modules yet.

# REQUIRED DATA MODELS

Implement or complete:

```text
ServiceCategory
OrganizationService
Industry
OrganizationIndustry
Technology
Portfolio
PortfolioTechnology
```

If required by the docs, add provider capability fields such as:

```text
minProjectValue
maxProjectValue
currency
typicalDurationMin
typicalDurationMax
isPrimary
experienceLevel
teamCapacity
availability
```

Use migrations.

# SERVICE TAXONOMY

Seed realistic initial IT service categories:

```text
Custom Software Development
Web Development
Mobile Development
ERP
CRM
AI Development
Data & Analytics
Cloud
DevOps
Cybersecurity
IT Outsourcing
UI/UX
System Integration
Digital Transformation
SaaS Implementation
```

Support nested categories only if the current schema supports it cleanly.

# INDUSTRY TAXONOMY

Seed:

```text
Technology
Retail
FMCG
Manufacturing
Logistics
Finance
Healthcare
Education
Hospitality
Construction
Property
Automotive
Government
Professional Services
Other
```

# PROVIDER ONBOARDING

Implement:

```text
Company
Services
Project Range
Industries
Portfolio
Team / Capacity
Verification Summary
Complete
```

Use a stepper with:
- progress;
- autosave;
- back/continue;
- validation;
- clear optional fields.

# COMPANY PROFILE

Route:

```text
/app/company
```

Sections:

```text
Company
Capabilities
Services
Industries
Portfolio
Team
Verification
Availability
```

# PROFILE STRENGTH

Implement deterministic profile completeness.

Example factors:

```text
Company Basics        20
Services              20
Industries            10
Project Range         10
Portfolio             25
Team / Capacity       10
Verification          5
```

Return:
- percentage;
- missing items;
- next recommended action.

Do not use AI.

# PORTFOLIO

Fields:

```text
Project Name
Client Display Name
Confidential Client flag
Industry
Problem
Solution
Outcome
Technology
Project Value Range
Duration
Started At
Completed At
Images optional
```

Support NDA-safe display:

```text
Confidential FMCG Company
```

# PROVIDER DASHBOARD FOUNDATION

Update provider dashboard with:
- profile strength;
- capability summary;
- verification summary;
- clear CTA to complete profile.

Do not invent opportunity analytics yet.

# SEED DATA

Create at least 10 fictional Indonesian B2B providers.

Include:

```text
Sagara Software
Nusa Systems
Orbit Teknologi
Tera Digital Labs
Karya Cloud Indonesia
```

Give them different:
- services;
- industries;
- project ranges;
- portfolio;
- locations;
- team sizes.

# REQUIRED APIs

Implement docs-aligned endpoints or equivalent server actions:

```text
GET/PATCH /api/v1/provider/profile
GET/POST/PATCH/DELETE /api/v1/provider/services
GET/POST/GET:id/PATCH/DELETE /api/v1/portfolio
GET /api/v1/services
GET /api/v1/industries
```

# AUTHORIZATION

Provider company editing:
- OWNER;
- ADMIN.

SALES:
- read capability/profile;
- no destructive profile changes unless explicitly granted.

MEMBER:
- read-only by default.

# TESTS

Unit:
- profile strength;
- provider permission rules.

Integration:
- create service;
- update service;
- create portfolio;
- confidentiality behavior;
- organization isolation.

E2E:
```text
Provider Login
→ Add Service
→ Add Industry
→ Add Portfolio
→ Profile Strength updates
```

# ACCEPTANCE CRITERIA

Phase complete only when:

```text
provider capability persists
service taxonomy works
industry taxonomy works
portfolio persists
NDA-safe client display works
profile strength is deterministic
tenant isolation works
provider dashboard reflects actual capability data
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
TemuClient V1 — Phase 2 Provider Capability

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
