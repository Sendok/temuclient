# TemuClient API Contract

**Version:** v1  
**Base Path:** `/api/v1`  
**Style:** REST-oriented with domain services underneath  
**Authentication:** Session-based for web V1

---

## 1. Response Conventions

### Success

```json
{
  "data": {},
  "meta": {}
}
```

### List

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error

```json
{
  "error": {
    "code": "OPPORTUNITY_NOT_FOUND",
    "message": "Opportunity not found.",
    "fieldErrors": {}
  }
}
```

Do not expose stack traces.

---

## 2. Common Error Codes

```text
UNAUTHENTICATED
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
RATE_LIMITED
CONFLICT
ORGANIZATION_SUSPENDED
OPPORTUNITY_NOT_ACTIVE
INTRODUCTION_ALREADY_EXISTS
INTRODUCTION_INVALID_STATE
DEAL_INVALID_STATE
FILE_TYPE_NOT_ALLOWED
FILE_TOO_LARGE
AI_RATE_LIMITED
```

---

## 3. Authentication

### POST `/auth/register`

Purpose: create user account.

Body:

```json
{
  "name": "Arsyad",
  "email": "arsyad@example.com",
  "password": "..."
}
```

Returns:
- user;
- session state.

Errors:
- email already used;
- password invalid.

---

### POST `/auth/login`

Body:

```json
{
  "email": "arsyad@example.com",
  "password": "..."
}
```

Platform-admin accounts are rejected with `USE_ADMIN_LOGIN` and must use the
separate `POST /auth/admin-login` route. The admin route accepts only users with
a platform role and never assigns an active organization.

### POST `/auth/admin-login`

Dedicated login for platform `SUPER_ADMIN`, `ADMIN`, and `MODERATOR` accounts.
Non-platform accounts receive `ADMIN_ACCESS_REQUIRED`. Successful sessions are
redirected to `/admin` and never enter company onboarding.

---

### POST `/auth/logout`

Requires authenticated session.

---

### POST `/auth/forgot-password`

Body:

```json
{
  "email": "arsyad@example.com"
}
```

Always return generic success response.

---

### POST `/auth/reset-password`

Body:

```json
{
  "token": "...",
  "password": "..."
}
```

---

### GET `/auth/session`

Returns current:
- user;
- active organization;
- memberships;
- platform role.

---

## 4. Organization APIs

### POST `/organizations`

Requires an authenticated user without an active organization membership. Creates the organization and an active `OWNER` membership in one transaction, then makes it the session's active organization.

Body:

```json
{
  "name": "Sagara Software",
  "type": "PROVIDER",
  "website": "https://example.com",
  "city": "Surabaya",
  "description": "Software engineering partner for Indonesian businesses."
}
```

### GET `/organizations/:id`

Roles:
- member of organization;
- admin where appropriate.

Returns role-sensitive organization DTO.

---

### PATCH `/organizations/:id`

Allowed:
- OWNER;
- ADMIN.

Body may include:

```json
{
  "name": "Sagara Software",
  "website": "https://example.com",
  "description": "...",
  "province": "Jawa Timur",
  "city": "Surabaya"
}
```

Side effects:
- audit log;
- possible matching recalculation when capabilities change.

---

### GET `/organizations/:id/members`

Allowed:
- OWNER;
- ADMIN.

---

### POST `/organizations/:id/members`

Allowed:
- OWNER;
- ADMIN.

Body:

```json
{
  "email": "sales@example.com",
  "role": "SALES"
}
```

Side effects:
- invitation;
- audit.

The effective subscription seat limit is enforced server-side. `FREE` supports
2 occupied seats, `PRO` supports 10, and `BUSINESS` is unlimited. Active,
invited, and suspended memberships occupy a seat.

---

### PATCH `/organizations/:id/members/:memberId`

Allowed:
- OWNER;
- ADMIN.

Cannot remove the last OWNER.

---

### DELETE `/organizations/:id/members/:memberId`

Allowed:
- OWNER;
- ADMIN.

---

## 5. Provider Profile

### GET `/provider/profile`

Returns:
- organization;
- services;
- industries;
- profile strength;
- verification summary.

---

### PATCH `/provider/profile`

Allowed:
- OWNER;
- ADMIN.

May update company capability fields, team capacity, availability, and the complete organization-industry selection. Industry replacement is transactional.

---

## 6. Provider Services

### GET `/provider/services`

### POST `/provider/services`

Allowed:
- OWNER;
- ADMIN.

Body:

```json
{
  "serviceCategoryId": "svc_123",
  "description": "Custom software development",
  "minProjectValue": 50000000,
  "maxProjectValue": 500000000,
  "currency": "IDR",
  "typicalDurationMin": 2,
  "typicalDurationMax": 6,
  "isPrimary": true
}
```

### PATCH `/provider/services/:id`

Allowed:
- OWNER;
- ADMIN.

### DELETE `/provider/services/:id`

Allowed:
- OWNER;
- ADMIN.

Deletion may trigger match recalculation.

---

## 7. Portfolio

### GET `/portfolio`

Query:
- page;
- pageSize;
- industry;
- status.

### POST `/portfolio`

Allowed:
- OWNER;
- ADMIN.

Body includes:
- title;
- client display;
- confidentiality flag;
- problem;
- solution;
- outcome;
- budget range;
- duration;
- technologies.

### GET `/portfolio/:id`

Confidential portfolio list/display DTOs expose `clientDisplayName` and never expose the stored private client name. The owning organization may receive `clientName` only from the authorized single-record edit endpoint.

### PATCH `/portfolio/:id`

### DELETE `/portfolio/:id`

---

## 8. Buyer Opportunity APIs

### GET `/opportunities`

Returns only Opportunities owned by the active Buyer organization. Provider organizations and unrelated Buyer tenants are rejected server-side.

### POST `/opportunities`

Allowed:
- buyer OWNER/ADMIN;
- permitted buyer MEMBER.

Creates DRAFT.

Body:

```json
{
  "title": "Warehouse Management System",
  "serviceCategoryId": "svc_wms",
  "industryId": "ind_manufacturing",
  "problemStatement": "...",
  "projectType": "NEW_DEVELOPMENT",
  "budgetMin": 250000000,
  "budgetMax": 400000000,
  "currency": "IDR",
  "country": "Indonesia",
  "province": "Jawa Timur",
  "city": "Surabaya",
  "remoteAllowed": true
}
```

---

### GET `/opportunities/:id`

Authorization-sensitive DTO:
- buyer owner sees full;
- matched provider sees provider-safe;
- admin sees moderation view.

---

### PATCH `/opportunities/:id`

Allowed:
- buyer organization with permission;
- only mutable states.

---

### POST `/opportunities/:id/publish`

Validation:
- current state DRAFT or REVIEW;
- minimum required fields;
- organization eligible;
- no blocking verification issue.

Side effects:
1. calculate buyer intent;
2. set ACTIVE/MATCHING;
3. create audit;
4. dispatch `OpportunityPublished`;
5. enqueue matching.

---

### POST `/opportunities/:id/pause`

Allowed from ACTIVE/MATCHING.

---

### POST `/opportunities/:id/cancel`

Cannot cancel WON.

---

### POST `/opportunities/:id/extend`

Extends expiry if eligible.

### POST `/opportunities/:id/attachments`

Allowed while the Opportunity is `DRAFT` or `REVIEW`. Validates MIME type, maximum 10 MB size, and visibility metadata. DTOs never expose the private storage key.

---

### GET `/opportunities/:id/matches`

Buyer only.

Query:
- sort;
- minScore;
- page.

Returns provider-safe match cards.

---

## 9. Opportunity Feed

### GET `/opportunity-feed`

Provider only.

Query:

```text
q
industry
service
budgetMin
budgetMax
city
intentMin
verification
matchMin
projectType
sort
cursor
pageSize
```

Returns provider-safe opportunity DTOs.

Default sort:
1. match score;
2. intent score;
3. recency.

---

### GET `/opportunity-feed/:id`

Provider only.

Requires:
- visible opportunity;
- provider organization eligible.

Returns:
- opportunity detail;
- match breakdown;
- safe verification summary;
- no restricted buyer contact.

---

## 10. Saved Opportunity

### POST `/opportunities/:id/save`

Provider member.

Idempotent.

### DELETE `/opportunities/:id/save`

Provider member.

---

## 11. AI Requirement Builder

### POST `/ai/requirements/analyze`

Body:

```json
{
  "text": "Kami membutuhkan sistem untuk inventory di 5 warehouse..."
}
```

Returns structured initial understanding.

---

### POST `/ai/requirements/questions`

Returns 1–5 clarification questions.

Must be Zod validated.

---

### POST `/ai/requirements/structure`

Returns structured draft:

```json
{
  "title": "...",
  "businessObjective": "...",
  "problemStatement": "...",
  "requirements": [],
  "budget": {},
  "timeline": {},
  "location": {}
}
```

Never auto-publish.

When no AI provider is configured, all three Requirement Builder endpoints return Zod-validated deterministic fallback output with `mode: "fallback"`. The manual structured review remains fully functional.

---

## 12. Introduction APIs

### POST `/opportunities/:id/introductions`

Provider only.

Validation:
- opportunity ACTIVE/MATCHING;
- provider has valid match;
- no active duplicate introduction;
- provider not suspended.

Body:

```json
{
  "portfolioIds": ["port_1"],
  "fitSummary": "...",
  "proposedApproach": "...",
  "estimatedTimeline": "4–6 bulan",
  "message": "..."
}
```

Side effects:
- create introduction;
- audit;
- notify buyer.

---

### GET `/introductions`

Filter:
- status;
- direction;
- opportunity.

Role-sensitive.

---

### GET `/introductions/:id`

Only involved organizations + admin.

---

### POST `/introductions/:id/accept`

Buyer permission required.

Transactional side effects:
1. status ACCEPTED;
2. set acceptedBy/acceptedAt;
3. create conversation;
4. create participants;
5. optionally create initial deal;
6. audit;
7. notification;
8. analytics.

Idempotent.

---

### POST `/introductions/:id/decline`

Buyer permission required.

Optional body:

```json
{
  "reason": "Capability mismatch"
}
```

---

### POST `/introductions/:id/cancel`

Provider organization before acceptance.

---

## 13. Conversations

### GET `/conversations`

Returns conversations for current user.

Query:
- unreadOnly;
- opportunityId;
- dealId;
- cursor.

---

### GET `/conversations/:id`

Requires participant membership.

Returns:
- context;
- participants;
- opportunity/deal summary.

---

### GET `/conversations/:id/messages`

Cursor paginated.

---

### POST `/conversations/:id/messages`

Body:

```json
{
  "body": "Kami sudah review requirement...",
  "replyToId": null
}
```

Side effects:
- update conversation;
- create notification;
- analytics.

---

## 14. Meetings

### GET `/meetings`

Query:
- upcoming;
- past;
- opportunityId;
- dealId.

---

### POST `/meetings`

Allowed involved buyer/provider participants.

Body:

```json
{
  "title": "Discovery Meeting",
  "opportunityId": "opp_123",
  "dealId": "deal_123",
  "startsAt": "2026-08-15T03:00:00Z",
  "endsAt": "2026-08-15T04:00:00Z",
  "timezone": "Asia/Jakarta",
  "meetingProvider": "GOOGLE_MEET",
  "meetingUrl": "https://..."
}
```

---

### GET `/meetings/:id`

### PATCH `/meetings/:id`

### POST `/meetings/:id/cancel`

Side effects:
- notification;
- audit where applicable.

---

## 15. Deals

### GET `/deals`

Provider-focused V1.

Query:
- stage;
- owner;
- q;
- expectedCloseFrom;
- expectedCloseTo;
- view.

---

### POST `/deals`

Typically created from accepted introduction.

Manual creation allowed only if connected to a valid TemuClient opportunity/relationship.

---

### GET `/deals/:id`

Returns:
- deal;
- opportunity context;
- activities;
- next actions;
- intelligence.

---

### PATCH `/deals/:id`

Allowed:
- OWNER;
- ADMIN;
- assigned SALES.

---

### POST `/deals/:id/stage`

Body:

```json
{
  "stage": "PROPOSAL"
}
```

Validation:
- allowed transition.

Side effects:
- update deal;
- stage history;
- activity;
- analytics;
- possible notifications.

---

### POST `/deals/:id/won`

Body:

```json
{
  "finalValue": 350000000
}
```

Side effects:
- status WON;
- stage WON;
- wonAt;
- review eligibility;
- analytics.

---

### POST `/deals/:id/lost`

Body:

```json
{
  "reason": "Budget not approved"
}
```

---

## 16. Deal Activities

### GET `/deals/:id/activities`

### POST `/deals/:id/activities`

Body:

```json
{
  "type": "NOTE",
  "title": "Discovery summary",
  "description": "..."
}
```

---

## 17. Proposals

### GET `/deals/:id/proposals`

### POST `/deals/:id/proposals`

Creates next version.

### GET `/proposals/:id`

### PATCH `/proposals/:id`

Only DRAFT may be freely edited.

### POST `/proposals/:id/submit`

Side effects:
- status SUBMITTED;
- submittedAt;
- activity;
- notification.

---

## 18. AI Sales

All endpoints:
- authenticated;
- authorized to entity;
- rate-limited;
- Zod validated;
- logged to AIExecution.

Provider behavior:
- `AI_PROVIDER=deterministic` enables an explicitly labelled contextual fallback for local/degraded operation;
- `AI_PROVIDER=gemini` uses the configured stable `GEMINI_MODEL` through the Google Gen AI SDK and never stores the raw prompt in `AIExecution`;
- configured-provider failures return `AI_PROVIDER_UNAVAILABLE`, preserve client input, and write a failed `AIExecution`;
- rate limits are scoped by user, organization, feature, and plan foundation.

Generated content is assistance only. Follow-Up and Proposal Outline responses always require review and never create a Message, Proposal, or other commercial mutation.

### POST `/ai/opportunity-summary`

### POST `/ai/match-explanation`

### POST `/ai/meeting-prep`

### POST `/ai/discovery-analysis`

### POST `/ai/follow-up`

Returns draft only. Never sends automatically.

### POST `/ai/proposal-outline`

### POST `/ai/deal-health`

Example:

```json
{
  "data": {
    "score": 72,
    "positiveSignals": [],
    "risks": [],
    "nextBestAction": "Schedule solution review with procurement."
  }
}
```

---

## 19. Notifications

### GET `/notifications`

Query:
- unreadOnly;
- cursor;
- pageSize.

### POST `/notifications/:id/read`

### POST `/notifications/read-all`

---

## 20. Verification

### GET `/verifications`

Organization-scoped.

### POST `/verifications/request`

Body:

```json
{
  "type": "DOMAIN",
  "entityType": "ORGANIZATION",
  "entityId": "org_123"
}
```

---

## 21. Admin

Base: `/admin`

### GET `/admin/users`

### GET `/admin/organizations`

### GET `/admin/organizations/:id`

### POST `/admin/organizations/:id/suspend`

### GET `/admin/opportunities`

### GET `/admin/opportunities/:id`

### POST `/admin/opportunities/:id/flag`

### GET `/admin/verifications`

### POST `/admin/verifications/:id/approve`

### POST `/admin/verifications/:id/reject`

Requires a moderation reason. Only `PENDING` verifications may transition to
`REJECTED`.

### POST `/admin/verifications/:id/request-information`

Keeps the verification `PENDING`, stores the reviewer note, notifies active
organization members, and writes an audit record.

### GET `/admin/audit-logs`

Every admin mutation must create an audit record.

Platform permissions:

- `SUPER_ADMIN`, `ADMIN`, and `MODERATOR` may review verification and flag an Opportunity;
- only `SUPER_ADMIN` and `ADMIN` may suspend an organization;
- platform role is independent from organization membership role.

Suspended organizations retain read access to existing business data but every
new commercial mutation returns `ORGANIZATION_SUSPENDED` server-side.

---

## 22. Taxonomy APIs

### GET `/industries`

Returns the active, ordered Industry reference catalog. Industry, Technology,
and ServiceCategory reference records are installed through production-safe
migrations and contain no demo organization or user data.

Public/authenticated read.

### GET `/services`

Returns the active ServiceCategory catalog ordered by `sortOrder`, including
stable ID, name, slug, description, and optional parent ID. Public/authenticated
read so both onboarding paths can load it before commercial mutations begin.

Admin:
- create;
- edit;
- deactivate.

### GET `/technologies`

Public/authenticated taxonomy read for portfolio technology selection.

---

## 23. Upload API

### POST `/uploads/sign`

Body:

```json
{
  "category": "PORTFOLIO_IMAGE",
  "fileName": "project.png",
  "mimeType": "image/png",
  "size": 1200000
}
```

Server:
- validates category;
- validates MIME;
- validates max size;
- returns signed upload target.

Production uses a short-lived S3 POST policy that pins the organization-scoped
opaque key, exact MIME type, and maximum content length. `mock` mode returns
`enabled: false` and must never imply that a real upload occurred.

### GET `/attachments/:id/download`

Returns a short-lived private download URL only after server-side Buyer,
platform-admin, matched-provider, attachment-visibility, and accepted-
Introduction authorization checks.

## 24. Billing

### GET `/billing/subscription`

Organization scoped. Returns plan, status, centralized entitlements, billing
mode, plan catalog, recent QRIS invoices, and whether paid subscriptions are
enabled.

The response distinguishes the stored plan from `effectivePlan`. Only
`ACTIVE`/`TRIALING` plans whose `periodEnd` has not passed are effective;
otherwise access falls back to `FREE`.

### POST `/billing/checkout`

Organization `OWNER` or `ADMIN` only. Creates one dynamic QRIS invoice for a
one-month `PRO` subscription. Buyer organizations are rejected because Buyer
access remains free. A still-valid pending invoice is reused to prevent
duplicate charges.

```json
{
  "plan": "PRO",
  "billingPeriodMonths": 1
}
```

The response includes the provider-hosted QR image and expiry time. Client-side
payment claims never activate a plan.

### POST `/billing/webhooks/:provider`

Requires an HMAC signature in `x-temuclient-signature`. Provider event IDs are
persisted uniquely and retry idempotency is enforced transactionally.

For `/billing/webhooks/midtrans`, authenticity follows Midtrans's signed
notification fields (`order_id + status_code + gross_amount + server key`). The
service validates QRIS as the payment type and the stored invoice amount, then
activates or extends the plan only for a verified settlement notification.

## 25. Health

### GET `/health/live`

Process liveness only.

### GET `/health/ready`

Checks PostgreSQL and Redis without returning connection strings, credentials,
or internal exception details. Responses are not cached.

---

## 26. Article Content

### POST `/admin/articles`

Requires platform role `SUPER_ADMIN` or `ADMIN`. Accepts `multipart/form-data`
with one `file` field containing `.md` or `.markdown`, maximum 500 KB.

The server validates frontmatter, normalizes Markdown, enforces a single page
H1 through frontmatter title, upserts by slug, calculates reading time, and
creates an audit entry. Raw HTML is never executed by the public renderer.

Success:

```json
{
  "data": {
    "id": "...",
    "slug": "cara-memilih-vendor",
    "title": "Cara Memilih Vendor",
    "status": "DRAFT"
  },
  "meta": {}
}
```

Errors include `ARTICLE_FILE_REQUIRED`, `ARTICLE_FRONTMATTER_REQUIRED`,
`ARTICLE_FRONTMATTER_INVALID`, `ARTICLE_CONTENT_TOO_SHORT`,
`ARTICLE_HEADING_INVALID`, `FILE_TYPE_NOT_ALLOWED`, and `FILE_TOO_LARGE`.

Public articles are server-rendered at `/insight` and `/insight/:slug`; they are
not exposed through an unauthenticated mutation API.

---

## 27. API Pagination

Feed:
- cursor-based.

Admin tables:
- page-based allowed.

Example cursor response:

```json
{
  "data": [],
  "meta": {
    "nextCursor": "..."
  }
}
```

---

## 28. Rate Limits

Recommended categories:

```text
auth login: strict
password reset: strict
message send: moderate
AI: plan-based
search: moderate
introduction request: strict per opportunity/provider
upload signing: moderate
```

---

## 29. Security Requirements

Every endpoint must:
- authenticate where required;
- authorize organization/entity access;
- validate request;
- use DTO projection;
- never expose hidden buyer information;
- use consistent error mapping.

---

## 30. Related Documents

- `DATABASE_SCHEMA.md`
- `SYSTEM_DESIGN.md`
- `USER_FLOWS.md`
- `SCREEN_SPECIFICATIONS.md`
