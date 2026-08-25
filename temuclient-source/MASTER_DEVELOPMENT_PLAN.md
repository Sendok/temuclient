# MASTER_DEVELOPMENT_PLAN.md — TemuClient V1

**Product:** TemuClient  
**Version:** 1.0  
**Development Strategy:** Vertical slices with phase gates  
**Core Loop:** Need → Match → Introduction → Meeting → Deal

---

## 1. Objective

Build TemuClient V1 as a production-coherent B2B opportunity platform.

Development must prove the complete marketplace loop before expanding into secondary features.

Priority order:

```text
Foundation
→ Provider Capability
→ Buyer Requirement
→ Matching
→ Introduction
→ Messaging & Meeting
→ Deals
→ AI
→ Admin & Verification
→ Billing & Production Hardening
```

---

## 2. Development Philosophy

Do not build all pages first.

Each phase must connect:

```text
UI
→ API / Server Action
→ Validation
→ Authorization
→ Domain Service
→ Database
→ Tests
```

A screen that does not persist or enforce rules is not considered complete.

---

# MILESTONE 0 — Repository Bootstrap

## Goal

Create a stable repository and development environment.

## Scope

```text
Next.js 16
TypeScript strict
Tailwind
shadcn/ui
Geist
ESLint
PostgreSQL
Prisma
Redis
Docker Compose
.env.example
docs/
AGENTS.md
```

## Acceptance Criteria

```text
app boots locally
database connects
redis connects
prisma migration works
lint passes
typecheck passes
build passes
```

---

# MILESTONE 1 — Foundation

## Goal

Support secure accounts, organizations, role selection, and application shells.

## Scope

### Authentication
- register;
- login;
- logout;
- email verification foundation;
- password reset foundation.

### Organization
- User
- Organization
- OrganizationMember
- buyer/provider organization type.

### RBAC
- OWNER
- ADMIN
- SALES
- MEMBER

### UI
- marketing shell foundation;
- auth screens;
- onboarding role selection;
- company onboarding;
- provider app shell;
- buyer app shell;
- mobile navigation;
- settings skeleton.

### Seed
- one buyer account;
- one provider account;
- one admin account.

## Acceptance Flow

```text
Register
→ Login
→ Choose Cari Client / Cari Vendor
→ Create Organization
→ Reach correct dashboard
```

## Quality Gate

Must pass:

```text
RBAC tests
tenant isolation tests
lint
typecheck
test
build
```

---

# MILESTONE 2 — Provider Capability

## Goal

Allow providers to accurately describe what they can sell.

## Scope

### Data
- ServiceCategory
- OrganizationService
- Industry
- OrganizationIndustry
- Technology
- Portfolio
- PortfolioTechnology

### UI
- provider onboarding;
- services;
- project range;
- industries;
- portfolio;
- company profile;
- profile strength;
- baseline verification status.

### Seed
At least 10 realistic provider companies.

## Acceptance Flow

```text
Provider Login
→ Company
→ Services
→ Industries
→ Portfolio
→ Profile Complete
```

## Gate

Provider profile data must persist and be queryable for matching.

---

# MILESTONE 3 — Buyer Requirement

## Goal

Allow buyers to publish a structured, valid business opportunity.

## Scope

### Data
- Opportunity
- OpportunityRequirement
- OpportunityAttachment
- Verification foundation
- Buyer Intent Score

### UI
- buyer dashboard;
- requirement list;
- new requirement;
- requirement review;
- requirement detail;
- publish;
- pause;
- cancel;
- extend.

### AI Foundation
Optional provider-backed requirement analysis.

AI must never auto-publish.

## Acceptance Flow

```text
Buyer Login
→ New Requirement
→ Describe Need
→ Structured Requirement
→ Review
→ Publish
→ Opportunity ACTIVE
```

## Tests

- opportunity state transitions;
- buyer permission;
- required publish validation;
- private attachment visibility.

---

# MILESTONE 4 — Matching Engine

## Goal

Create the first real TemuClient network effect.

## Scope

### Matching Weights

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

### Data
- OpportunityMatch
- algorithmVersion
- score breakdown
- reasons

### Provider UI
- opportunity feed;
- filters;
- opportunity detail;
- save opportunity;
- Match Score;
- Buyer Intent;
- verification summary.

### Buyer UI
- provider matches;
- provider detail;
- shortlist;
- compare up to 3 providers.

## Acceptance Flow

```text
Buyer publishes
→ Matching runs
→ Provider receives ranked opportunity
→ Buyer receives ranked providers
```

## Critical Privacy Gate

Provider feed must not expose restricted buyer data.

Add explicit tests.

---

# MILESTONE 5 — Introduction

## Goal

Move from matching into trusted connection.

## Scope

### Data
- SavedOpportunity
- Introduction

### Provider
- Request Introduction
- select portfolio
- fit summary
- proposed approach
- optional AI drafting

### Buyer
- introduction inbox
- provider review
- accept
- decline

### Transaction
On accept:

```text
Introduction ACCEPTED
→ Conversation created
→ participants created
→ Deal may be initialized
→ notifications created
→ audit recorded
```

## Acceptance Flow

```text
Provider requests introduction
→ Buyer accepts
→ connection becomes available
```

## Gate

Duplicate active introductions must be blocked.

---

# MILESTONE 6 — Messaging & Meetings

## Goal

Support the first real business conversation.

## Scope

### Messaging
- Conversation
- ConversationParticipant
- Message
- unread state
- notifications

### Meetings
- Meeting
- MeetingParticipant
- schedule
- reschedule
- cancel
- meeting link
- upcoming/past.

### UI
- desktop conversation layout;
- mobile conversation;
- meeting list;
- meeting detail.

## Acceptance Flow

```text
Accepted Introduction
→ Message
→ Schedule Meeting
→ Meeting Completed
```

---

# MILESTONE 7 — Deal Pipeline

## Goal

Track business progress from introduction to commercial result.

## Scope

### Data
- Deal
- DealStageHistory
- DealActivity
- Proposal

### UI
- deal board;
- deal list;
- deal detail;
- activity timeline;
- notes;
- proposal;
- mark won/lost.

### Stages

```text
INTRODUCTION
DISCOVERY
PROPOSAL
NEGOTIATION
WON
LOST
```

## Acceptance Flow

```text
Accepted Introduction
→ Deal
→ Discovery
→ Proposal
→ Negotiation
→ Won / Lost
```

## Gate

Every stage change:
- validated;
- persisted;
- stage history written;
- analytics event emitted.

---

# MILESTONE 8 — AI Sales Assistant

## Goal

Improve salesperson quality without replacing human review.

## Scope

```text
Opportunity Summary
Match Explanation
Meeting Prep
Discovery Analysis
Follow-Up Draft
Proposal Outline
Deal Health
Next Best Action
```

## Rules

- no autonomous sends;
- structured output validated;
- AIExecution logged;
- authorization required;
- feature-level rate limits.

## Acceptance Flow

```text
Meeting
→ AI Prep
→ Meeting Notes
→ Discovery Analysis
→ Suggested Follow-Up
→ Deal Health
```

---

# MILESTONE 9 — Admin & Verification

## Goal

Protect trust and marketplace quality.

## Scope

### Admin
- dashboard;
- users;
- organizations;
- opportunities;
- verification queue;
- risk flags;
- audit logs.

### Verification
- Company
- Domain
- Contact
- Requirement
- Budget
- Decision Maker

### Actions
- approve;
- reject;
- request information;
- flag;
- suspend.

## Gate

Every sensitive admin action creates AuditLog.

---

# MILESTONE 10 — Billing, Analytics & Production Hardening

## Goal

Prepare V1 for controlled launch.

## Scope

### Subscription
- FREE
- PRO
- BUSINESS

### Analytics
North Star:

```text
Qualified Introductions per Month
```

Funnel:

```text
Opportunity
→ Match
→ Introduction
→ Accepted
→ Meeting
→ Proposal
→ Deal
```

### Production
- rate limiting;
- error tracking;
- structured logs;
- request IDs;
- backup strategy;
- environment validation;
- security headers;
- production DB migration process;
- file limits;
- privacy checks.

---

## 3. V1 Launch Scenario

TemuClient is launch-ready only when this scenario works without manual database edits.

### Buyer

```text
Create Account
→ Create Company
→ Create Requirement
→ Publish
→ Receive Provider Matches
→ Compare Provider
→ Accept Introduction
→ Message
→ Schedule Meeting
```

### Provider

```text
Create Account
→ Create Company
→ Add Services
→ Add Portfolio
→ Receive Opportunity
→ Review Match
→ Request Introduction
→ Get Accepted
→ Message
→ Meeting
→ Deal
→ Proposal
→ Mark Won / Lost
```

### Admin

```text
Review Company
→ Verify
→ Review Opportunity
→ Verify Requirement
→ Inspect Audit Trail
```

---

## 4. Seed Scenario

Use a stable deterministic seed for development and tests.

### Buyer

```text
PT Nusantara Logistik
Industry: Logistics
Location: Surabaya
```

Requirement:

```text
Warehouse Management System
Budget: Rp250–400 juta
Timeline: 4–6 bulan
Buyer Intent: Very High
```

### Providers

```text
Sagara Software
Expected Match: ~94%

Nusa Systems
Expected Match: ~82%

Orbit Teknologi
Expected Match: ~61%
```

The exact score may evolve, but tests should validate factor logic.

---

## 5. Required Validation Per Milestone

Before completion:

```text
lint
typecheck
unit tests
integration tests
production build
```

Run relevant E2E tests where the phase introduces a critical flow.

---

## 6. Definition of Done

A milestone is complete when:

```text
implementation exists
UI is functional
data persists
authorization works
validation works
loading/empty/error states exist
tests pass
build passes
docs remain aligned
```

Not complete:

```text
UI mock only
fake data only
button without behavior
API without authorization
schema without migration
feature without tests
```

---

## 7. Development Reporting

At the end of every milestone produce:

```text
IMPLEMENTATION REPORT

Milestone:
Status:

Completed:
-

Not completed:
-

Changed files:
-

Database migration:
-

New APIs:
-

New routes:
-

Tests:
-

Commands run:
-

Build:
-

Known issues:
-

Documentation updated:
-

Recommended next milestone:
-
```

---

## 8. Recommended Branch Strategy

Suggested:

```text
main
develop
feature/m1-foundation
feature/m2-provider
feature/m3-buyer-requirement
feature/m4-matching
feature/m5-introduction
feature/m6-messaging-meetings
feature/m7-deals
feature/m8-ai-sales
feature/m9-admin-verification
feature/m10-hardening
```

Keep milestone PRs reviewable.

Avoid one enormous V1 branch.

---

## 9. Launch Target

Do not optimize for broad feature count.

Optimize for:

```text
real buyer requirement
real provider match
real introduction
real meeting
real deal progression
```

TemuClient V1 succeeds when the marketplace loop works reliably.
