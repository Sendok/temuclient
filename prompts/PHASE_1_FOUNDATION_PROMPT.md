# PHASE_1_FOUNDATION_PROMPT.md

Use this prompt with Codex, Claude Code, Cursor, or another coding agent.

---

You are implementing **TemuClient V1 — Phase 1 Foundation**.

Before making any code changes:

1. Read `/AGENTS.md`.
2. Read all files under `/docs`:
   - `DESIGN_SYSTEM.md`
   - `SYSTEM_DESIGN.md`
   - `DATABASE_SCHEMA.md`
   - `API_CONTRACT.md`
   - `USER_FLOWS.md`
   - `SCREEN_SPECIFICATIONS.md`
3. Inspect the existing repository and current implementation.
4. Reuse working code where appropriate.
5. Do not rewrite unrelated working modules.
6. Produce a concise implementation plan before coding.

TemuClient is a **Verified B2B Opportunity Network**.

Core loop:

```text
Need → Match → Introduction → Meeting → Deal
```

This phase is only the **Foundation**.

Do not implement complete Opportunity, Matching, Messaging, Deals, Billing, or AI features yet.

You may create interfaces or placeholders only where necessary for architecture, but do not create fake completed business features.

---

# PHASE GOAL

A new user must be able to:

```text
Register
→ Login
→ Choose Cari Client or Cari Vendor
→ Create Organization
→ Reach the correct Buyer or Provider application shell
```

Authorization and tenant isolation must work server-side.

---

# REQUIRED STACK

Use the repository's existing stack if already aligned.

Target stack:

```text
Next.js 16
App Router
TypeScript strict mode
Tailwind CSS
shadcn/ui
Geist
React Hook Form
Zod
PostgreSQL
Prisma ORM
Redis
```

Use a modular monolith architecture.

Do not introduce microservices.

---

# IMPLEMENTATION SCOPE

## 1. Project Foundation

Ensure:

```text
Next.js App Router
TypeScript strict
Tailwind
shadcn/ui
Geist font
ESLint
environment validation
```

Add only necessary dependencies.

---

## 2. Design System Foundation

Implement design tokens based on:

```text
/docs/DESIGN_SYSTEM.md
```

Required:

```text
light mode tokens
dark-mode-ready token structure
typography
spacing
radius
semantic status colors
button variants
form primitives
card primitives
badge primitives
loading skeleton
empty state
error state
```

Do not overbuild component abstractions.

---

## 3. Local Infrastructure

Create or verify:

```text
docker-compose.yml
```

Services:

```text
PostgreSQL
Redis
```

Create:

```text
.env.example
```

Minimum variables:

```env
DATABASE_URL=
REDIS_URL=
AUTH_SECRET=
APP_URL=http://localhost:3000
```

Optional future provider variables may be included but must not be required in Phase 1.

---

## 4. Database Foundation

Implement Prisma models required for Phase 1.

Minimum:

```text
User
Organization
OrganizationMember
```

Required enums:

```text
UserStatus
OrganizationType
OrganizationRole
MembershipStatus
```

Organization types:

```text
BUYER
PROVIDER
HYBRID
```

Roles:

```text
OWNER
ADMIN
SALES
MEMBER
```

Create migration.

Create seed data.

Do not add unrelated future tables unless required by existing schema architecture.

---

## 5. Authentication

Implement or complete:

```text
register
login
logout
session
forgot-password foundation
reset-password foundation
email verification foundation
```

If a supported authentication library is already present, use it rather than replacing it without reason.

Security requirements:

```text
HTTP-only secure session cookie
password hashing
server-side session checks
rate-limit-ready structure
no sensitive errors
```

---

## 6. Organization Creation

After registration, user enters onboarding.

Route:

```text
/onboarding
```

Question:

```text
Apa tujuan Anda menggunakan TemuClient?
```

Options:

```text
Cari Client
Saya menawarkan layanan dan ingin mendapatkan opportunity baru.

Cari Vendor
Perusahaan saya membutuhkan solusi atau provider.
```

Do not use a dropdown.

Selection determines organization type:

```text
Cari Client → PROVIDER
Cari Vendor → BUYER
```

---

## 7. Company Onboarding

Create role-specific onboarding flow.

Provider minimum:

```text
company name
website optional
city
description
logo optional
```

Buyer minimum:

```text
company name
website optional
city
description
business email optional
```

Creating an organization must also create:

```text
OrganizationMember
role = OWNER
status = ACTIVE
```

Use a database transaction.

---

## 8. RBAC

Create centralized server-side authorization utilities.

Minimum checks:

```text
requireUser()
requireOrganization()
requireOrganizationRole()
requireOrganizationType()
```

Do not duplicate permission logic across pages.

Provider-only screens must reject Buyer organizations server-side.

Buyer-only screens must reject Provider organizations server-side.

Add explicit unauthorized/forbidden states.

---

## 9. Tenant Isolation

A user must not access:

```text
another organization's settings
another organization's member list
another organization's onboarding state
```

Add tests that attempt cross-organization access.

This is a hard acceptance gate.

---

## 10. Provider App Shell

Create provider application shell using:

```text
/docs/DESIGN_SYSTEM.md
```

Navigation:

```text
Overview
Opportunities
Introductions
Deals
Messages
Meetings
AI Sales
Company Profile
Analytics
```

Footer:

```text
Notifications
Settings
Help
```

Only `Overview`, `Company Profile`, and relevant Foundation pages need real content in Phase 1.

Future nav items may display explicit:

```text
Coming in next development phase
```

but do not create misleading fake data or interactions.

---

## 11. Buyer App Shell

Navigation:

```text
Overview
Requirements
Providers
Introductions
Messages
Meetings
Company
```

Footer:

```text
Notifications
Settings
Help
```

Only Foundation-relevant pages need full functionality.

---

## 12. Responsive Navigation

Desktop:

```text
collapsible sidebar
```

Mobile Provider:

```text
Home
Opportunities
Deals
Messages
More
```

Mobile Buyer:

```text
Home
Requirements
Providers
Messages
More
```

Ensure navigation is keyboard accessible.

---

## 13. Dashboard Foundation

Provider Dashboard must not invent opportunity data.

If no real opportunity module exists:

Show an intentional foundation empty state.

Example:

```text
Profil perusahaan Anda siap untuk dilengkapi.

Tambahkan layanan dan portfolio pada fase berikutnya agar TemuClient dapat mulai mencocokkan opportunity.
```

Buyer dashboard:

```text
Perusahaan berhasil dibuat.

Langkah berikutnya adalah membuat requirement pertama.
```

Do not hard-code fake production analytics.

---

## 14. Settings Foundation

Create:

```text
/app/settings/profile
/app/settings/company
/app/settings/members
/app/settings/security
```

Role-aware visibility is required.

Company settings must persist.

Member management may initially support:

```text
list members
show role
```

Invitation can be implemented if straightforward and consistent with API docs.

---

## 15. Seed Data

Create deterministic development seed.

Minimum:

### Admin

```text
admin@temuclient.local
```

### Provider

```text
Sagara Software
provider@temuclient.local
```

### Buyer

```text
PT Nusantara Logistik
buyer@temuclient.local
```

Use clearly documented development credentials.

Never use seed passwords in production.

---

# REQUIRED ROUTES

At minimum:

```text
/
/login
/register
/forgot-password
/onboarding

/app

/app/company
/app/settings/profile
/app/settings/company
/app/settings/members
/app/settings/security
```

Role-aware route behavior is required.

---

# REQUIRED TESTS

## Unit

```text
RBAC role checks
organization-type checks
permission helpers
```

## Integration

```text
register
create organization
create owner membership
company update authorization
```

## Tenant Isolation

Test:

```text
User A in Organization A
cannot read or mutate
Organization B.
```

## E2E

Recommended:

```text
register provider
→ onboarding
→ organization
→ provider dashboard

register buyer
→ onboarding
→ organization
→ buyer dashboard
```

---

# REQUIRED QUALITY STATES

Every implemented page must define:

```text
loading
empty
error
forbidden
mobile behavior
```

---

# REQUIRED COMMANDS BEFORE COMPLETION

Detect the package manager and run equivalent commands for:

```text
lint
typecheck
unit tests
integration tests
production build
```

Run E2E if configured.

Do not claim completion if any required command fails.

If failures are caused by pre-existing repository issues, clearly distinguish them from new issues.

---

# DOCUMENTATION

Update documentation only if implementation requires an architectural change.

Do not modify product scope casually.

Create/update README instructions for:

```text
local setup
environment
database migration
seed
development server
tests
```

---

# ACCEPTANCE CRITERIA

Phase 1 is complete only when all of these are true:

### User

```text
Can register
Can login
Can logout
Can restore valid session
```

### Onboarding

```text
Can choose Cari Client
Can choose Cari Vendor
Can create organization
Becomes OWNER
```

### Routing

```text
Provider reaches Provider shell
Buyer reaches Buyer shell
```

### Security

```text
Provider cannot access Buyer-only organization screens
Buyer cannot access Provider-only screens
User cannot access another organization's data
```

### Data

```text
User persists
Organization persists
Membership persists
Company updates persist
```

### Engineering

```text
migration works
seed works
lint passes
typecheck passes
tests pass
build passes
```

---

# FINAL RESPONSE FORMAT

After implementation, return exactly this structure:

```text
IMPLEMENTATION REPORT

Phase:
TemuClient V1 — Phase 1 Foundation

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

New API / Server Actions:
-

New routes:
-

RBAC implemented:
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
TemuClient V1 — Phase 2 Provider Capability
```

Do not claim features that are not actually implemented and tested.
