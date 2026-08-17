# TemuClient Screen Specifications

**Version:** 1.0  
**UI Language:** Bahasa Indonesia  
**Design Reference:** `DESIGN_SYSTEM.md`

---

## 1. Screen Specification Template

Every implemented screen should define:

```text
Screen Name
Route
Allowed Roles
Primary User Goal
Primary CTA
Secondary Actions
Entry Points
Exit Points
Data Required
API Used
Components
Loading State
Empty State
Error State
Permission Rules
Analytics Events
Mobile Behavior
```

---

# PUBLIC

## 2. Landing Page

**Route:** `/`  
**Roles:** Public  
**Primary Goal:** Understand TemuClient value and choose buyer/provider path.  
**Primary CTA:** `Temukan Opportunity`  
**Secondary CTA:** `Saya Mencari Vendor`

### Sections
- Navbar
- Hero
- Opportunity intelligence preview
- How it works
- For providers
- For buyers
- Trust / verification
- Selected opportunity preview
- Pricing
- FAQ
- Footer

### Components
- MarketingNav
- Hero
- OpportunityPreview
- TrustBadgeGroup
- CTASection

### Analytics
- `landing_viewed`
- `provider_cta_clicked`
- `buyer_cta_clicked`

### Mobile
- stacked hero;
- CTA full width;
- no oversized desktop mockups.

---

## 3. For Providers

**Route:** `/for-providers`  
Goal: explain how providers get qualified opportunities.

Primary CTA: `Daftar sebagai Provider`

Content:
- problem;
- opportunity model;
- match score;
- verification;
- introduction flow;
- pricing.

---

## 4. For Buyers

**Route:** `/for-buyers`  
Goal: explain how buyers describe need and receive provider shortlist.

Primary CTA: `Cari Vendor`

---

## 5. Opportunity Directory

**Route:** `/opportunities`  
Public-safe opportunity teasers only.

Sensitive buyer identity hidden unless opted in.

Filters:
- service;
- industry;
- city;
- budget.

CTA:
- `Masuk untuk Melihat Detail`

---

## 6. Provider Directory

**Route:** `/providers`

Public verified provider profiles.

Filters:
- service;
- industry;
- location.

---

# AUTH

## 7. Login

**Route:** `/login`  
Primary Goal: sign in.  
Primary CTA: `Masuk`

Components:
- Email
- Password
- Google OAuth
- Forgot password

Errors:
- invalid credentials;
- suspended user;
- rate-limited.

---

## 8. Register

**Route:** `/register`  
Primary Goal: create account.

CTA:
`Daftar`

After success:
`/onboarding`

## 8A. Admin Login

**Route:** `/admin/login`  
**Roles:** Platform `SUPER_ADMIN`, `ADMIN`, `MODERATOR`  
**Goal:** Enter the platform operations console without organization onboarding.  
**Rules:** User login rejects platform accounts; admin login rejects organization
members without a platform role. Admin logout returns to `/admin/login`.

---

# ONBOARDING

## 9. Role Selection

**Route:** `/onboarding`

Primary Goal:
Choose usage intent.

Options:
- `Cari Client`
- `Cari Vendor`

Do not use dropdown.

Analytics:
- `role_selected`

---

## 10. Provider Company Setup

**Route:** `/onboarding/provider/company`

Fields:
- company name;
- website;
- city;
- description;
- logo.

CTA:
`Lanjutkan`

API:
- create/update organization.

---

## 11. Provider Services

**Route:** `/onboarding/provider/services`

Goal:
Define what the provider sells.

Components:
- service selector;
- project range;
- duration;
- primary service.

Empty prevention:
at least one service required.

---

## 12. Provider Portfolio

**Route:** `/onboarding/provider/portfolio`

Goal:
Provide trust evidence.

Allow:
- Add first portfolio;
- Skip with profile strength penalty.

---

## 13. Provider Verification

**Route:** `/onboarding/provider/verification`

Goal:
Complete baseline verification.

Show:
- company;
- domain;
- business email.

CTA:
`Kirim Verifikasi`

---

## 14. Buyer Company Setup

**Route:** `/onboarding/buyer/company`

Goal:
Create buyer organization.

CTA:
`Lanjutkan`

---

## 15. Buyer Verification

**Route:** `/onboarding/buyer/verification`

Goal:
Verify business email/domain before publishing high-trust requirement.

---

# PROVIDER APP

## 16. Provider Dashboard

**Route:** `/app`  
**Roles:** Provider members  
**Primary Goal:** Know what action to take today.  
**Primary CTA:** `Lihat Opportunity`

### Data
- new opportunity count;
- introductions;
- meetings;
- pipeline value;
- top matches;
- next best actions.

### Components
- PageHeader
- StatCard
- OpportunityCard
- NextBestAction
- MeetingList

### Empty State
No opportunity:
`Lengkapi Profile`

### APIs
- dashboard aggregate endpoint or server-side service composition;
- opportunity feed preview;
- deals summary;
- meetings summary.

### Analytics
- `provider_dashboard_viewed`

### Mobile
- metrics horizontal scroll or 2x2;
- stacked opportunity cards.

---

## 17. Opportunity Feed

**Route:** `/app/opportunities`  
**Roles:** Provider  
**Primary Goal:** Find relevant opportunity.  
**Primary CTA:** `Lihat Opportunity`

### Components
- FilterBar
- SearchField
- OpportunityCard / OpportunityCompactRow
- Pagination or cursor loader

### Filters
- q
- industry
- service
- budget
- city
- timeline
- intent
- verification
- match
- project type

### APIs
`GET /api/v1/opportunity-feed`

### Loading
card skeletons.

### Empty
suggest relaxing filters or completing profile.

### Mobile
filter bottom sheet.

---

## 18. Opportunity Detail

**Route:** `/app/opportunities/[id]`  
**Roles:** Provider  
**Primary Goal:** Decide whether to request introduction.  
**Primary CTA:** `Request Introduction`  
**Secondary:** `Save`

### Main Content
- Overview
- Business Problem
- Objectives
- Requirements
- Deliverables
- Timeline
- Budget
- Location
- Safe attachments

### Sticky Intelligence
- Match Score
- Buyer Intent
- Verification
- Competition
- Expiry
- Why You Match

### APIs
`GET /api/v1/opportunity-feed/:id`

### Permission
No restricted buyer contact.

### Analytics
- `opportunity_viewed`
- `opportunity_saved`
- `introduction_started`

### Mobile
intelligence becomes expandable section; CTA sticky bottom.

---

## 19. Request Introduction Drawer

**Route:** modal/drawer from opportunity detail  
Primary Goal: submit credible introduction request.

Fields:
- relevant portfolio;
- fit summary;
- proposed approach;
- timeline;
- short message.

AI assists drafting only.

CTA:
`Kirim Permintaan Introduction`

API:
`POST /api/v1/opportunities/:id/introductions`

---

## 20. Saved Opportunities

**Route:** `/app/opportunities/saved`

Goal:
review saved opportunities.

Empty:
`Simpan opportunity untuk ditinjau nanti.`

---

## 21. Introductions

**Route:** `/app/introductions`

Tabs:
- All
- Pending
- Accepted
- Declined

Columns/card:
- opportunity;
- buyer safe display;
- status;
- date;
- next action.

---

## 22. Messages

**Route:** `/app/messages`

Desktop:
- conversation list;
- active conversation;
- context panel.

Context panel:
- opportunity;
- company;
- deal stage;
- next action;
- meeting.

API:
- conversations;
- messages.

Mobile:
conversation list → full-screen thread.

---

## 23. Meetings

**Route:** `/app/meetings`

Views:
- Upcoming
- Past

Actions:
- Join
- Reschedule
- Prepare with AI

---

## 24. Meeting Prep

**Route:** `/app/meetings/[id]/prepare`

Sections:
- Company Snapshot
- Opportunity Summary
- Pain Points
- Stakeholders
- Discovery Questions
- Relevant Portfolio
- Objections
- Desired Outcome

API:
`POST /api/v1/ai/meeting-prep`

---

## 25. Deals Board

**Route:** `/app/deals`

Views:
- Board
- List

Board columns:
- INTRODUCTION
- DISCOVERY
- PROPOSAL
- NEGOTIATION

Closed deals accessible via filters.

Card:
- company;
- opportunity;
- value;
- probability;
- last activity;
- next action.

Drag-and-drop transition must call server validation.

---

## 26. Deal Detail

**Route:** `/app/deals/[id]`

Primary Goal:
advance deal.

Actions:
- Add Activity
- Schedule Meeting
- Add Note
- Create Proposal
- Mark Won
- Mark Lost

Tabs:
- Overview
- Activity
- Messages
- Meetings
- Proposal
- Notes

Right panel:
- Deal Health
- Stakeholders
- Risks
- Next Best Action

---

## 27. Proposal

**Route:** `/app/deals/[id]/proposal` or `/app/proposals/[id]`

Goal:
create and submit proposal version.

AI can create outline.

CTA:
`Submit Proposal`

---

## 28. AI Sales

**Route:** `/app/ai-sales`

Task-based modules:
- Meeting Prep
- Opportunity Analysis
- Discovery Analysis
- Follow-Up
- Proposal Outline
- Deal Coach

Do not make generic blank chatbot the main UI.

---

## 29. Company Profile

**Route:** `/app/company`

Sections:
- Company
- Capabilities
- Services
- Industries
- Portfolio
- Team
- Verification
- Availability

Show profile strength with actionable recommendations.

---

## 30. Provider Verification

**Route:** `/app/company/verification`

Show:
- Company Verification
- Domain
- Business Email
- Business Documents
- Advanced Verification

Status:
- Verified
- Pending
- Rejected
- Optional

---

## 31. Provider Analytics

**Route:** `/app/analytics`

Metrics:
- opportunities viewed;
- introduction requests;
- accepted introductions;
- meetings;
- proposals;
- deals won;
- pipeline value;
- conversion funnel.

Avoid vanity metrics.

---

# BUYER APP

## 32. Buyer Dashboard

**Route:** `/app` for buyer context

Metrics:
- Active Requirements
- Providers Matched
- Introductions
- Upcoming Meetings

Sections:
- requirement status;
- new provider matches;
- next actions.

---

## 33. Requirements

**Route:** `/app/requirements`

Columns/cards:
- Requirement
- Status
- Matches
- Shortlisted
- Introductions
- Updated

CTA:
`Buat Requirement`

API:
buyer opportunity list.

---

## 34. New Requirement

**Route:** `/app/requirements/new`

Primary Goal:
describe business need.

Headline:
`Apa yang perusahaan Anda butuhkan?`

Textarea example:
`Kami membutuhkan sistem untuk mengelola inventory di 5 warehouse...`

CTA:
`Mulai`

---

## 35. AI Requirement Builder

**Route:** `/app/requirements/new/builder`

Goal:
convert initial description into structured requirements.

Use conversational prompts only for clarification.

Then structured fields.

Progress:
- Understand
- Clarify
- Structure
- Review

---

## 36. Requirement Review

**Route:** `/app/requirements/[id]/review`

Sections:
- Project
- Business Objective
- Problem
- Requirements
- Users
- Integrations
- Timeline
- Budget
- Location
- Provider Preference

CTA:
`Publish Requirement`

Secondary:
`Save Draft`

---

## 37. Requirement Detail

**Route:** `/app/requirements/[id]`

Goal:
track provider matching and progress.

Header:
- status;
- intent;
- verification.

Tabs:
- Overview
- Matches
- Introductions
- Meetings
- Activity

---

## 38. Provider Matches

**Route:** `/app/requirements/[id]/matches`

Provider card:
- logo;
- verified;
- match;
- services;
- relevant experience;
- portfolio;
- project size;
- location.

Actions:
- View Provider
- Shortlist
- Compare

---

## 39. Provider Detail

**Route:** `/app/providers/[id]`

Sections:
- Overview
- Capabilities
- Portfolio
- Industries
- Team
- Technology
- Reviews
- Verification

Sticky panel:
- Match
- Budget fit
- Industry fit
- Experience

CTA:
`Request Introduction`

---

## 40. Compare Providers

**Route:** `/app/requirements/[id]/compare`

Maximum:
3 providers.

Dimensions:
- Match
- Service Compatibility
- Industry Experience
- Portfolio
- Typical Budget
- Team
- Location
- Verification
- Rating

Do not rank solely on price.

---

## 41. Buyer Introductions

**Route:** `/app/introductions`

Buyer actions:
- accept;
- decline;
- open provider;
- open message after accepted.

---

# SHARED

## 42. Notification Drawer

Accessible globally.

Groups:
- Today
- Yesterday
- Earlier

Actions:
- mark read;
- mark all read;
- navigate to entity.

---

## 43. Settings

Routes:

```text
/app/settings/profile
/app/settings/company
/app/settings/members
/app/settings/notifications
/app/settings/security
/app/settings/billing
```

Role-aware visibility.

Billing settings show the actual persisted plan, status, centralized limits,
provider, and an explicit `Sandbox — no real payment` warning whenever live
payments are not configured. Buyer pricing is free. Provider `PRO` may be
enabled through environment-backed pricing and a dynamic QRIS invoice;
`BUSINESS` remains contact-based. The screen shows QR expiry and invoice history,
and only `OWNER` or `ADMIN` may initiate payment. TemuClient does not charge a
success fee or deduct a percentage of deal value. Provider Analytics uses persisted funnel events;
FREE users receive the base funnel without fake metrics.

Subscription enforcement:

- `FREE`: 10 distinct Opportunity details per calendar month, no factor-level
  Match Intelligence, no Provider AI Sales Assistant, 2 occupied team seats.
- `PRO`: 100 distinct Opportunity details per month, Match Intelligence,
  Provider AI Sales Assistant, advanced organization-scoped analytics, 10 seats.
- `BUSINESS`: unlimited Opportunity details and seats, all Pro features, plus a
  priority-support contact path. Matching score/ranking itself remains neutral
  and deterministic for every plan; payment never buys a higher Match Score.

---

# ADMIN

## 44. Admin Dashboard

**Route:** `/admin`

Metrics:
- pending verification;
- active opportunities;
- flagged opportunities;
- provider count;
- buyer count;
- recent moderation activity.

---

## 45. Admin Users

**Route:** `/admin/users`

Table:
- user;
- organization;
- status;
- created;
- last login;
- actions.

---

## 46. Admin Companies

**Route:** `/admin/companies`

Filters:
- type;
- status;
- verification;
- city.

---

## 47. Admin Company Detail

**Route:** `/admin/companies/[id]`

Sections:
- company;
- members;
- verification;
- services;
- portfolio;
- activity;
- risk flags.

Actions:
- verify;
- suspend;
- request info.

All actions audited.

---

## 48. Admin Opportunities

**Route:** `/admin/opportunities`

Filters:
- status;
- verification;
- buyer;
- intent;
- flagged.

---

## 49. Admin Opportunity Review

**Route:** `/admin/opportunities/[id]`

Shows:
- buyer;
- requirement;
- budget;
- timeline;
- contact;
- verification signals;
- risk flags;
- history.

Actions:
- Verify
- Reject
- Request Information
- Flag
- Suspend organization where justified

---

## 50. Verification Queue

**Route:** `/admin/verifications`

Table:
- entity;
- type;
- status;
- submitted at;
- risk;
- reviewer.

---

## 51. Audit Log

**Route:** `/admin/audit-logs`

Filters:
- actor;
- entity type;
- action;
- date.

Read-only.

---

## 52. Insight Directory

**Route:** `/insight`  
**Roles:** Public  
**Goal:** Discover reviewed B2B guidance.  
**Data:** Published articles only.  
**SEO/GEO:** Canonical metadata, semantic headings, ItemList structured data,
sitemap, RSS, and `llms.txt`.  
**Empty:** Explain that reviewed insight will appear soon.  
**Mobile:** Single-column article summaries with compact metadata.

## 53. Insight Article

**Route:** `/insight/[slug]`  
**Roles:** Public  
**Goal:** Read a factual, citable B2B guide.  
**Data:** One published Article. Draft and archived slugs return not found.  
**Components:** Breadcrumb, category, title, direct summary, author/date,
semantic Markdown, tags, Article/Breadcrumb/optional FAQ structured data.  
**Error:** Standard not-found page; unpublished content is never leaked.

## 54. Admin Articles

**Route:** `/admin/articles`  
**Roles:** `SUPER_ADMIN`, `ADMIN` mutate; `MODERATOR` read-only.  
**Goal:** Upload a reviewed `.md` article and inspect publication state.  
**Validation:** Extension, 500 KB limit, frontmatter schema, minimum content,
heading hierarchy, and unique/upserted slug.  
**States:** Busy upload, success, validation error, empty list, forbidden mutation,
and responsive stacked layout.

---

## 55. Global Loading Rules

Use:
- skeletons matching final structure;
- progressive rendering for secondary panels.

Do not block entire page for a low-priority widget.

---

## 56. Global Empty-State Rules

Each empty state must:
- explain why it is empty;
- suggest next action;
- have at most one primary CTA.

---

## 57. Global Error Rules

Every screen should define:
- network retry;
- access denied;
- not found;
- invalid state.

---

## 58. Global Analytics Naming

Use snake_case.

Examples:
- `opportunity_viewed`
- `introduction_requested`
- `provider_compared`
- `deal_stage_changed`

---

## 59. Related Documents

- `DESIGN_SYSTEM.md`
- `USER_FLOWS.md`
- `API_CONTRACT.md`
- `DATABASE_SCHEMA.md`
