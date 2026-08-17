# UI_UX_PROTOTYPE_PROMPT.md — TemuClient V1

You are acting as a combined:

- Principal Product Designer
- Senior UI/UX Designer
- Design System Lead
- Senior Frontend Prototyping Engineer

Your task is to design and implement a **high-fidelity interactive UI/UX prototype** for **TemuClient V1**.

This prototype will become the visual baseline for production development.

Do NOT build the full backend.

Do NOT build real billing, real AI, real messaging infrastructure, or production authentication.

Focus on:

- premium UI quality;
- realistic UX;
- complete user journeys;
- responsive behavior;
- reusable components;
- realistic dummy data;
- interaction states;
- visual consistency.

---

# 1. BEFORE DESIGNING

Read these files first:

```text
/AGENTS.md
/docs/DESIGN_SYSTEM.md
/docs/SYSTEM_DESIGN.md
/docs/DATABASE_SCHEMA.md
/docs/API_CONTRACT.md
/docs/USER_FLOWS.md
/docs/SCREEN_SPECIFICATIONS.md
```

Treat them as the product source of truth.

Do not invent new product terminology unless necessary.

Do not change product logic casually.

---

# 2. PRODUCT CONTEXT

TemuClient is a:

# Verified B2B Opportunity Network

Core product loop:

```text
Need
→ Qualification
→ Match
→ Introduction
→ Meeting
→ Deal
```

TemuClient helps Providers find companies that genuinely need their services.

TemuClient helps Buyers describe business problems and find a small number of qualified providers.

TemuClient is NOT:

```text
Freelance Marketplace
Job Marketplace
Generic CRM
Contact Database
Lead Scraper
WhatsApp Blast Tool
Tender Bidding Marketplace
```

---

# 3. PRIMARY DESIGN GOAL

The product should feel like:

> A premium B2B intelligence platform used by CEOs, Sales Directors, CTOs, business owners, and procurement teams.

The UI must communicate:

```text
Trust
Opportunity
Intelligence
Business Value
Clarity
Professionalism
```

The interface should feel more like:

```text
modern enterprise intelligence
+
premium SaaS
+
business operating system
```

rather than:

```text
freelancer marketplace
generic admin template
legacy CRM
```

---

# 4. DESIGN DIRECTION

Use an aesthetic that is:

- elegant;
- premium;
- calm;
- sophisticated;
- highly readable;
- modern;
- enterprise-grade;
- data-aware;
- confident without being loud.

Avoid:

- excessive gradients;
- neon;
- crypto-style UI;
- overly playful cards;
- cartoon illustrations;
- excessive shadows;
- huge rounded rectangles;
- glassmorphism everywhere;
- decorative animation;
- generic dashboard templates.

---

# 5. VISUAL SYSTEM

Follow `/docs/DESIGN_SYSTEM.md`.

Primary palette:

```text
Canvas        #F7F8FA
Surface       #FFFFFF
Primary Text  #111827
Secondary     #667085
Muted         #98A2B3
Border        #E4E7EC

Deep Indigo   #3730A3
Brand         #4F46E5
Brand Subtle  #EEF2FF

Success       #059669
Warning       #D97706
Danger        #DC2626
```

Typography:

```text
Geist Sans
```

Fallback:

```text
Inter
system-ui
sans-serif
```

Default radius:

```text
6–12px
```

Do not use large 24–32px radii on every card.

---

# 6. PRODUCT UI LANGUAGE

Primary UI language:

# Bahasa Indonesia

Keep standard business/product terms in English where appropriate:

```text
Opportunity
Match Score
Buyer Intent
Pipeline
Discovery
Proposal
Request Introduction
Deal Health
```

Do not force awkward translations.

---

# 7. PROTOTYPE TECHNOLOGY

Build the prototype using:

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Lucide Icons
```

Use mocked local data.

No production database required.

Use:

```text
/src/data/mock/
```

or equivalent clean structure.

All screens must work without external services.

---

# 8. PROTOTYPE ARCHITECTURE

Use:

```text
src/
  app/
  components/
  data/mock/
  lib/
```

Do NOT mix UI with production backend assumptions.

Create reusable components.

Example:

```text
AppShell
Sidebar
MobileBottomNav
PageHeader
StatCard
OpportunityCard
MatchScore
BuyerIntent
VerificationSummary
ProviderCard
DealCard
PipelineBoard
AIInsightCard
NextBestAction
EmptyState
Skeleton
```

---

# 9. RESPONSIVE BREAKPOINTS

Design for:

```text
Mobile
Tablet
Laptop
Desktop
Wide Desktop
```

Desktop:

```text
Sidebar + Main Content
```

Tablet:

```text
Collapsible Sidebar
```

Mobile:

```text
Bottom Navigation
```

Do not simply shrink desktop tables.

Transform them into:

```text
Cards
Stacked Rows
Bottom Sheets
Drawers
```

---

# 10. APPLICATION SHELL

Desktop layout:

```text
┌────────────────┬──────────────────────────────────────────┐
│                │ Top Context Bar                          │
│    Sidebar     ├──────────────────────────────────────────┤
│                │                                          │
│                │ Main Content                             │
│                │                                          │
└────────────────┴──────────────────────────────────────────┘
```

Sidebar:

```text
240–272px expanded
64–72px collapsed
```

Add:

```text
Organization Switcher
Primary Action
Navigation
Notifications
Settings
User Menu
```

---

# 11. GLOBAL COMMAND PALETTE

Implement:

```text
⌘ K
Ctrl K
```

Commands:

```text
Search Opportunities
Search Companies
Search Deals
Navigate
Create Requirement
Open Settings
```

---

# 12. REQUIRED PROTOTYPE SCREENS

The following screens must be designed and implemented.

Do not skip major screens.

---

# PUBLIC SCREENS

## 12.1 Landing Page

Route:

```text
/
```

Hero:

# Temukan client yang benar-benar membutuhkan layanan Anda.

Supporting copy:

> TemuClient mencocokkan bisnis Anda dengan opportunity B2B yang relevan, terverifikasi, dan siap dibawa ke tahap meeting.

Primary CTA:

```text
Temukan Opportunity
```

Secondary CTA:

```text
Saya Mencari Vendor
```

Hero visual:

Show realistic Opportunity Intelligence panel.

Example:

```text
Verified Logistics Company

Warehouse Management System

Match Score      94%
Buyer Intent     92
Budget           Rp250–400 jt
Timeline         4–6 bulan

✓ Requirement Verified
✓ Budget Confirmed
```

Sections:

```text
Hero
How It Works
For Providers
For Buyers
Verified Opportunities
Matching Intelligence
Trust & Verification
Pricing
FAQ
CTA
Footer
```

---

## 12.2 For Providers

Route:

```text
/for-providers
```

Explain:

```text
Opportunity
Matching
Introduction
Sales Assistance
Pipeline
```

---

## 12.3 For Buyers

Route:

```text
/for-buyers
```

Explain:

```text
Describe Requirement
Provider Matching
Compare
Introduction
Meeting
```

---

## 12.4 Pricing

Route:

```text
/pricing
```

Plans:

```text
FREE
PRO
BUSINESS
```

Use realistic feature differences.

Buyer remains FREE.

---

# AUTH SCREENS

## 12.5 Login

Route:

```text
/login
```

Minimal.

No large illustrations.

---

## 12.6 Register

Route:

```text
/register
```

---

# ONBOARDING

## 12.7 Role Selection

Route:

```text
/onboarding
```

Question:

# Apa tujuan Anda menggunakan TemuClient?

Cards:

### Cari Client

> Saya menawarkan layanan dan ingin mendapatkan opportunity baru.

### Cari Vendor

> Perusahaan saya membutuhkan solusi atau provider.

Use high visual prominence.

---

## 12.8 Provider Onboarding

Create multi-step experience:

```text
Company
Services
Project Range
Industries
Portfolio
Team
Verification
Complete
```

Show:
- progress;
- autosave state;
- back/continue;
- completion.

---

## 12.9 Buyer Onboarding

Steps:

```text
Company
Verification
Create First Requirement
```

---

# PROVIDER SCREENS

## 12.10 Provider Dashboard

Route:

```text
/app
```

Primary question:

> What should I do today to generate a client?

Header:

```text
Selamat pagi, Arsyad
Ada 7 opportunity baru yang cocok dengan perusahaan Anda.
```

Metrics:

```text
Opportunity Baru
Introductions
Meeting Minggu Ini
Pipeline Value
```

Section:

```text
Opportunity untuk Anda
```

Section:

```text
Next Best Actions
```

Example:

```text
Follow up PT Nusantara
Proposal menunggu 4 hari

Meeting dengan PT Retail besok
Siapkan discovery

Lengkapi portfolio
Profile strength 76%
```

---

## 12.11 Opportunity Feed

Route:

```text
/app/opportunities
```

Support:

```text
Search
Filters
Sort
Compact / Comfortable View
```

Filters:

```text
Industry
Service
Budget
Location
Timeline
Buyer Intent
Verification
Match Score
Project Type
```

Opportunity card example:

```text
SOFTWARE DEVELOPMENT                         2h ago

Warehouse Management System

Manufacturing • Surabaya

Perusahaan manufaktur mencari sistem warehouse
untuk 4 lokasi distribusi.

Rp250–400 jt
4–6 bulan

Buyer Intent
92 • Very High

Your Match
94%

Verified 4/5

3 provider interested

[View Opportunity]
```

---

## 12.12 Opportunity Detail

Route:

```text
/app/opportunities/[id]
```

Desktop:

```text
Main Content 65–70%
+
Sticky Intelligence Panel 30–35%
```

Main:

```text
Overview
Business Problem
Objectives
Requirements
Deliverables
Technology
Timeline
Budget
Location
Attachments
```

Right panel:

```text
94% Match
92 Buyer Intent
Verified 4/5
Competition
Expiry
Why You Match
```

CTA:

```text
Request Introduction
```

Secondary:

```text
Save
```

---

## 12.13 Request Introduction

Drawer/modal.

Fields:

```text
Relevant Portfolio
Why Your Company Fits
Proposed Approach
Estimated Timeline
Short Message
```

Include:

```text
Improve with AI
```

but AI should only mock suggested draft.

---

## 12.14 Introductions

Route:

```text
/app/introductions
```

Tabs:

```text
All
Pending
Accepted
Declined
```

---

## 12.15 Messages

Route:

```text
/app/messages
```

Desktop:

```text
Conversation List
Conversation
Context Panel
```

Context:

```text
Opportunity
Company
Deal Stage
Meeting
Next Action
```

---

## 12.16 Meetings

Route:

```text
/app/meetings
```

Views:

```text
Upcoming
Past
```

Actions:

```text
Join
Reschedule
Prepare with AI
```

---

## 12.17 AI Meeting Prep

Route:

```text
/app/meetings/[id]/prepare
```

Sections:

```text
Company Snapshot
Opportunity Summary
Possible Pain Points
Stakeholders
Discovery Questions
Relevant Portfolio
Possible Objections
Desired Outcome
```

---

## 12.18 Deal Pipeline

Route:

```text
/app/deals
```

Board:

```text
INTRODUCTION
DISCOVERY
PROPOSAL
NEGOTIATION
```

Closed:

```text
WON
LOST
```

Deal card:

```text
Company
Opportunity
Estimated Value
Probability
Last Activity
Next Action
```

Allow mocked drag-and-drop interaction.

---

## 12.19 Deal Detail

Route:

```text
/app/deals/[id]
```

Header:

```text
Company
Opportunity
Stage
Estimated Value
Probability
```

Tabs:

```text
Overview
Activity
Messages
Meetings
Proposal
Notes
```

Right panel:

```text
Deal Health
Stakeholders
Risks
Next Best Action
```

Example:

```text
Deal Health 72/100

Positive
✓ Budget confirmed
✓ CTO joined meeting

Risks
⚠ No next meeting
⚠ Procurement not involved

Next Best Action
Schedule solution review with procurement.
```

---

## 12.20 AI Sales

Route:

```text
/app/ai-sales
```

Do NOT make this a generic chatbot.

Create modules:

```text
Meeting Prep
Opportunity Analysis
Discovery Analysis
Follow-Up
Proposal Outline
Deal Coach
```

---

## 12.21 Provider Company Profile

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

Show:

```text
Profile Strength 82%
```

Provide actionable missing items.

---

# BUYER SCREENS

## 12.22 Buyer Dashboard

Show:

```text
Active Requirements
Providers Matched
Introductions
Upcoming Meetings
```

Sections:

```text
Active Requirements
New Provider Matches
Next Actions
```

---

## 12.23 Requirements

Route:

```text
/app/requirements
```

Show:

```text
Requirement
Status
Matches
Shortlisted
Introductions
Updated
```

CTA:

```text
Buat Requirement
```

---

## 12.24 Create Requirement

Route:

```text
/app/requirements/new
```

Headline:

# Apa yang perusahaan Anda butuhkan?

Textarea:

```text
Contoh: Kami membutuhkan sistem untuk mengelola inventory di 5 warehouse...
```

CTA:

```text
Mulai
```

---

## 12.25 AI Requirement Builder

Route:

```text
/app/requirements/new/builder
```

Flow:

```text
Understand
Clarify
Structure
Review
```

Do NOT make the entire flow a chatbot.

Use:

```text
AI understanding
+
structured forms
```

---

## 12.26 Requirement Review

Route:

```text
/app/requirements/[id]/review
```

Sections:

```text
Project
Business Objective
Problem
Requirements
Users
Integrations
Timeline
Budget
Location
Provider Preference
```

CTA:

```text
Publish Requirement
```

Secondary:

```text
Save Draft
```

---

## 12.27 Requirement Detail

Route:

```text
/app/requirements/[id]
```

Tabs:

```text
Overview
Matches
Introductions
Meetings
Activity
```

---

## 12.28 Provider Matches

Route:

```text
/app/requirements/[id]/matches
```

Provider card:

```text
Logo
Company
Verified
Match Score
Services
Relevant Experience
Portfolio
Typical Project Size
Location
Response Time
```

Actions:

```text
View Provider
Shortlist
Compare
```

---

## 12.29 Provider Detail

Route:

```text
/app/providers/[id]
```

Sections:

```text
Overview
Capabilities
Portfolio
Industries
Team
Technology
Reviews
Verification
```

Sticky panel:

```text
94% Match
Budget Fit
Industry Fit
Experience
```

CTA:

```text
Request Introduction
```

---

## 12.30 Compare Providers

Route:

```text
/app/requirements/[id]/compare
```

Max:

```text
3 providers
```

Compare:

```text
Match
Service Compatibility
Industry Experience
Portfolio
Typical Budget
Team
Location
Verification
Rating
```

Do not over-emphasize price.

---

# ADMIN

## 12.31 Admin Dashboard

Route:

```text
/admin
```

Show:

```text
Pending Verification
Active Opportunities
Flagged Opportunities
Providers
Buyers
Recent Moderation Activity
```

---

## 12.32 Admin Companies

Route:

```text
/admin/companies
```

---

## 12.33 Admin Company Detail

Route:

```text
/admin/companies/[id]
```

Sections:

```text
Company
Members
Verification
Services
Portfolio
Activity
Risk Flags
```

---

## 12.34 Admin Opportunities

Route:

```text
/admin/opportunities
```

---

## 12.35 Admin Opportunity Review

Route:

```text
/admin/opportunities/[id]
```

Show:

```text
Buyer
Requirement
Budget
Timeline
Contact
Verification
Risk Flags
History
```

Actions:

```text
Verify
Reject
Request Information
Flag
```

---

## 12.36 Verification Queue

Route:

```text
/admin/verifications
```

---

## 12.37 Audit Log

Route:

```text
/admin/audit-logs
```

---

# 13. MOCK DATA

Use realistic fictional Indonesian business data.

Do NOT use:

```text
John Doe
Acme Inc
Lorem Ipsum
```

Buyer examples:

```text
PT Nusantara Logistik
PT Sentra Manufaktur
PT Sumber Retail Indonesia
PT Arunika Distribusi
PT Cipta Pangan Nusantara
```

Provider examples:

```text
Sagara Software
Nusa Systems
Orbit Teknologi
Tera Digital Labs
Karya Cloud Indonesia
```

---

# 14. OPPORTUNITY MOCKS

Create at least 20.

Examples:

```text
Warehouse Management System
Sales Force Automation
ERP Manufacturing
Retail POS Modernization
Distributor Mobile App
HR Self Service Platform
Cybersecurity Assessment
Cloud Migration
Customer Portal
AI Customer Support
```

Different:

```text
industries
cities
budgets
intent scores
verification levels
match scores
timelines
```

Budget range:

```text
Rp25 juta
to
Rp1.5 miliar+
```

---

# 15. KEY DESIGN COMPONENTS

Create reusable variants.

## OpportunityCard

Variants:

```text
default
compact
featured
```

## MatchScore

Display:

```text
94%
Excellent Match
```

Avoid giant circular charts.

## BuyerIntent

Display:

```text
92
Very High Intent
```

## VerificationSummary

Default:

```text
Verified 4/5
```

Expandable:

```text
✓ Company
✓ Contact
✓ Requirement
✓ Budget
○ Decision Maker
```

## NextBestAction

Must visually stand out without dominating the page.

---

# 16. INFORMATION HIERARCHY

Every screen must clearly distinguish:

```text
DATA
SIGNAL
ACTION
```

Example:

```text
DATA
Budget Rp250–400 jt

SIGNAL
Buyer Intent 92

ACTION
Request Introduction
```

Do not make every number equal in visual importance.

---

# 17. PROTOTYPE INTERACTIONS

Implement frontend-only interactions for demonstration:

```text
filtering
search
sort
tabs
sidebar collapse
mobile nav
drawers
dialogs
save opportunity
shortlist provider
compare provider
request introduction modal
deal board drag
notification drawer
command palette
stepper
form validation
```

Use local state/mock data.

No production persistence required.

---

# 18. LOADING STATES

Create skeleton states for:

```text
dashboard
opportunity feed
opportunity detail
provider matches
deal board
messages
```

---

# 19. EMPTY STATES

Examples:

Provider:

```text
Belum ada opportunity yang cocok.

Lengkapi capability perusahaan agar matching menjadi lebih akurat.
```

Buyer:

```text
Belum ada requirement aktif.

Ceritakan kebutuhan perusahaan Anda dan TemuClient akan mencarikan provider yang relevan.
```

---

# 20. ERROR STATES

Prototype:

```text
Network Error
Not Found
Permission Denied
Expired Opportunity
Unavailable Introduction
```

Show recovery CTA.

---

# 21. ACCESSIBILITY

Implement:

```text
semantic HTML
keyboard navigation
visible focus
aria labels
AA contrast
touch targets
reduced motion
```

---

# 22. DARK MODE

Create token support.

Full dark-mode implementation is optional but preferred if it does not reduce prototype quality.

Do not simply invert colors.

---

# 23. FINAL VISUAL QUALITY

The result must look intentional at:

```text
1440px desktop
1280px laptop
768px tablet
390px mobile
```

Check every primary screen at desktop and mobile.

---

# 24. PROTOTYPE NAVIGATION

Create an easy way to switch prototype persona.

For prototype/demo only:

```text
Provider Demo
Buyer Demo
Admin Demo
```

This may be in a developer/demo switcher.

Do not treat it as production auth.

---

# 25. NO DEAD-END SCREEN

Every primary flow should be navigable.

Provider demo:

```text
Dashboard
→ Opportunity
→ Request Introduction
→ Introduction Accepted mock
→ Messages
→ Meeting
→ Deal
```

Buyer demo:

```text
Dashboard
→ Create Requirement
→ Requirement Review
→ Matches
→ Provider
→ Compare
→ Introduction
```

---

# 26. DESIGN REVIEW MODE

Create a route if useful:

```text
/design-system
```

Show:

```text
Colors
Typography
Buttons
Inputs
Badges
Cards
Match Score
Buyer Intent
Verification
Tables
Empty States
Skeletons
Dialogs
```

This helps verify consistency.

---

# 27. FILE STRUCTURE

Recommended:

```text
src/

  app/
    (marketing)/
    (prototype)/
    design-system/

  components/
    ui/
    shared/
    opportunity/
    provider/
    deal/
    messaging/
    ai/

  data/
    mock/
      companies.ts
      opportunities.ts
      deals.ts
      messages.ts
      meetings.ts

  lib/
```

---

# 28. DO NOT BUILD YET

Do not implement:

```text
real PostgreSQL persistence
real authentication
real OAuth
real Redis
real billing
real AI calls
real email sending
real S3
real WebSocket
production RBAC
production API
```

Unless required only as a lightweight mock interface.

This task is about UI/UX prototype quality.

---

# 29. REQUIRED OUTPUT

After implementation, provide:

```text
UI/UX PROTOTYPE REPORT

Status:
COMPLETE / PARTIAL / BLOCKED

Implemented Screens:
-

Reusable Components:
-

Responsive Coverage:
-

Prototype Interactions:
-

Mock Data:
-

Routes:
-

Known Visual Gaps:
-

Known UX Gaps:
-

Files Changed:
-

Lint:
-

Typecheck:
-

Build:
-
```

---

# 30. QUALITY GATE

Before marking COMPLETE:

Run:

```text
lint
typecheck
production build
```

Fix all issues introduced by this prototype.

---

# 31. FINAL ACCEPTANCE CRITERIA

The UI/UX prototype is complete only if:

```text
Landing Page exists
Provider flow is navigable
Buyer flow is navigable
Admin flow is navigable
Opportunity Feed looks production-grade
Opportunity Detail clearly shows intelligence
Requirement Builder is intuitive
Provider comparison works visually
Messaging layout is credible
Deal Pipeline is usable
AI Sales feels task-oriented
desktop responsive layout works
mobile responsive layout works
design system is consistent
dummy data feels realistic
there are no major dead-end screens
```

---

# FINAL PRINCIPLE

Every design decision should reinforce this idea:

> TemuClient does not help users browse random leads.

It helps them identify:

```text
Who needs what
Why it matters
How strong the match is
What action should happen next
```

The prototype should make that value immediately understandable.
