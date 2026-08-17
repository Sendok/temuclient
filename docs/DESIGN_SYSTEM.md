# TemuClient Design System

**Version:** 1.0  
**Product:** TemuClient  
**Status:** Source of Truth  
**Audience:** Product Design, Frontend, QA, Engineering  
**Primary UI Language:** Bahasa Indonesia  
**Design Direction:** Elegant, premium, calm, trustworthy, enterprise-grade B2B intelligence

---

## 1. Design Principles

TemuClient is not a generic SaaS dashboard and must not visually resemble a freelance marketplace.

Every interface should reinforce five principles:

1. **Trust before persuasion**  
   Verification, provenance, status, and data quality should be visible before promotional language.

2. **Signal over noise**  
   Prioritize Match Score, Buyer Intent, verification, budget, timeline, and Next Best Action over vanity metrics.

3. **Progressive disclosure**  
   Show enough information to make a decision, then reveal depth on demand.

4. **Operational clarity**  
   Each screen must answer:
   - Where am I?
   - What matters now?
   - What changed?
   - What should I do next?
   - What happens after I act?

5. **Professional density**  
   Use compact but readable information layouts. Avoid oversized cards, excessive whitespace, and decorative UI that reduces information efficiency.

---

## 2. Brand Character

TemuClient should feel:

- intelligent;
- verified;
- serious;
- modern;
- efficient;
- composed;
- premium;
- business-oriented.

TemuClient should not feel:

- playful;
- gamified;
- crypto-oriented;
- neon;
- freelancer-marketplace-like;
- crowded like a legacy CRM;
- AI-gimmicky.

Visual motifs may use:

- network nodes;
- structured signal;
- connection paths;
- convergence;
- verified states;
- opportunity indicators.

Avoid handshake clipart, generic people illustrations, and decorative gradients without functional purpose.

---

## 3. Color Tokens

### 3.1 Light Mode

```css
:root {
  --background: #F7F8FA;
  --surface: #FFFFFF;
  --surface-subtle: #F9FAFB;
  --surface-elevated: #FFFFFF;

  --text-primary: #111827;
  --text-secondary: #667085;
  --text-muted: #98A2B3;
  --text-inverse: #FFFFFF;

  --border-default: #E4E7EC;
  --border-strong: #D0D5DD;

  --brand-50: #EEF2FF;
  --brand-100: #E0E7FF;
  --brand-500: #4F46E5;
  --brand-600: #3730A3;
  --brand-700: #312E81;

  --success-50: #ECFDF3;
  --success-600: #059669;

  --warning-50: #FFFAEB;
  --warning-600: #D97706;

  --danger-50: #FEF3F2;
  --danger-600: #DC2626;

  --info-50: #EFF8FF;
  --info-600: #2563EB;
}
```

### 3.2 Dark Mode

```css
.dark {
  --background: #0C0D10;
  --surface: #121419;
  --surface-subtle: #151820;
  --surface-elevated: #181B22;

  --text-primary: #F5F7FA;
  --text-secondary: #D0D5DD;
  --text-muted: #98A2B3;

  --border-default: #272B35;
  --border-strong: #343A46;

  --brand-500: #818CF8;
  --brand-600: #6366F1;
}
```

### 3.3 Semantic Usage

| Token | Usage |
|---|---|
| Brand | Primary CTA, active nav, high-value selected state |
| Success | Verified, Won, accepted |
| Warning | Pending, incomplete, review needed |
| Danger | Rejected, lost, destructive action |
| Info | Neutral informational state |

Do not use semantic colors decoratively.

---

## 4. Typography

Primary font: **Geist Sans**  
Fallback: `Inter, system-ui, sans-serif`

### Type Scale

| Token | Size | Weight | Usage |
|---|---:|---:|---|
| `text-xs` | 12px | 400–500 | Metadata |
| `text-sm` | 13–14px | 400–500 | Dense UI |
| `text-base` | 14–16px | 400 | Main UI copy |
| `text-md` | 16–18px | 500–600 | Card title |
| `text-lg` | 20px | 600 | Section title |
| `text-xl` | 24px | 650 | Page title |
| `text-2xl` | 32px | 650 | Product emphasis |
| `text-hero` | 48–64px | 650 | Marketing hero only |

### Rules

- Avoid page-level headings above 32px inside the authenticated app.
- Use tabular numerals for money and scores.
- Use uppercase only for small metadata labels.
- Keep paragraphs between 55–75 characters wide where possible.

---

## 5. Spacing

Base rhythm: **8px**

Preferred spacing values:

```text
4, 8, 12, 16, 20, 24, 32, 40, 48, 64
```

Operational app:
- card padding: 16–20px;
- page horizontal padding: 24px desktop, 16px mobile;
- section gap: 24–32px;
- input vertical spacing: 12–16px.

Avoid large decorative gaps in dashboards.

---

## 6. Radius

```text
xs: 4px
sm: 6px
md: 8px
lg: 12px
xl: 14px
```

Use 8px as the default card radius.

Do not use 20px+ radius for standard cards.

---

## 7. Elevation

Use elevation sparingly.

### Level 0
Default surface with border.

### Level 1
Dropdown, popover, floating toolbar.

### Level 2
Dialog, command palette.

Prefer borders and surface changes over heavy shadows.

---

## 8. Motion

Default duration:

```text
120–180ms
```

Use motion for:
- sidebar collapse;
- modal entry;
- tabs;
- row hover;
- drag state;
- drawers;
- loading-to-content transition.

Avoid:
- bounce;
- parallax;
- looping decorative animation.

Always respect `prefers-reduced-motion`.

---

## 9. Application Shell

### Desktop

```text
┌───────────────┬──────────────────────────────────────────┐
│ Sidebar       │ Top Context Bar                          │
│               ├──────────────────────────────────────────┤
│               │ Main Content                             │
│               │                                          │
└───────────────┴──────────────────────────────────────────┘
```

Expanded sidebar: 240–272px  
Collapsed sidebar: 64–72px

### Provider Navigation

- Overview
- Opportunities
- Introductions
- Deals
- Messages
- Meetings
- AI Sales
- Company Profile
- Analytics

Footer:
- Notifications
- Settings
- Help

### Buyer Navigation

- Overview
- Requirements
- Providers
- Introductions
- Messages
- Meetings
- Company

Footer:
- Notifications
- Settings
- Help

### Mobile Bottom Navigation

Provider:
- Home
- Opportunities
- Deals
- Messages
- More

Buyer:
- Home
- Requirements
- Providers
- Messages
- More

---

## 10. Global Command Palette

Shortcut:
- `⌘ K`
- `Ctrl K`

Capabilities:
- navigate;
- search opportunity;
- search company;
- search deal;
- search conversation;
- create requirement;
- open settings.

Command Palette should become a high-frequency productivity interface.

---

## 11. Core Components

### Navigation
- `AppShell`
- `Sidebar`
- `MobileBottomNav`
- `TopContextBar`
- `Breadcrumb`
- `CommandPalette`

### Data
- `DataTable`
- `FilterBar`
- `FilterChip`
- `SearchField`
- `Pagination`
- `SortMenu`

### Opportunity
- `OpportunityCard`
- `OpportunityCompactRow`
- `MatchScore`
- `IntentBadge`
- `VerificationSummary`
- `OpportunityStatusBadge`
- `StickyIntelligencePanel`

### Company
- `CompanyAvatar`
- `CompanyCard`
- `ProviderMatchCard`
- `ProfileStrength`
- `CapabilityTag`

### Sales
- `DealCard`
- `PipelineBoard`
- `ActivityTimeline`
- `NextBestAction`
- `AIInsightCard`
- `DealHealth`

### Feedback
- `EmptyState`
- `ErrorState`
- `Skeleton`
- `Toast`
- `ConfirmDialog`
- `NotificationDrawer`

---

## 12. Opportunity Card

Default hierarchy:

1. Service category
2. Project title
3. Industry + location
4. Short problem summary
5. Budget + timeline
6. Buyer Intent
7. Match Score
8. Verification
9. Competition
10. CTA

Example:

```text
SOFTWARE DEVELOPMENT                           2h ago

Warehouse Management System

Manufacturing • Surabaya

Perusahaan manufaktur mencari sistem warehouse untuk
4 lokasi distribusi.

Rp250–400 jt            4–6 bulan

Buyer Intent   92 • Very High
Your Match     94%

Verified 4/5
3 provider interested

[View Opportunity]
```

---

## 13. Match Score

Use restrained representation:

```text
94%
Excellent Match
```

Breakdown appears only on expansion or detail screen.

Never make the default representation a large circular progress chart.

Score labels:

| Range | Label |
|---:|---|
| 90–100 | Excellent |
| 80–89 | Strong |
| 65–79 | Good |
| 50–64 | Moderate |
| <50 | Low |

---

## 14. Buyer Intent

```text
92
Very High Intent
```

| Score | Label |
|---:|---|
| 0–39 | Low |
| 40–59 | Medium |
| 60–79 | High |
| 80–100 | Very High |

Buyer Intent should be visually separate from Match Score.

---

## 15. Verification

Default compact representation:

```text
Verified 4/5
```

Expanded:

```text
✓ Company
✓ Contact
✓ Requirement
✓ Budget
○ Decision Maker
```

Verification state colors:
- verified: success;
- pending: warning;
- unavailable: muted;
- rejected: danger.

---

## 16. Forms

Rules:
- progressive disclosure;
- inline validation;
- autosave long workflows;
- explicit optional labels;
- examples for ambiguous fields;
- keyboard-accessible;
- preserve draft on navigation.

Do not create 30-field single-page forms.

For requirements:
- start conversationally;
- switch to structured forms after initial extraction;
- AI suggestions must always be reviewable before save/publish.

---

## 17. Tables

Use tables for:
- admin;
- provider deal list;
- buyer requirement list;
- verification queue;
- audit logs.

Tables should support where relevant:
- sorting;
- filtering;
- pagination;
- column visibility;
- row action menu.

On mobile, transform to cards or stacked rows.

---

## 18. Empty States

Every major screen must have a useful next action.

Provider:

> Belum ada opportunity yang cocok. Lengkapi capability perusahaan agar matching menjadi lebih akurat.

CTA: `Lengkapi Profile`

Buyer:

> Belum ada requirement aktif. Ceritakan kebutuhan perusahaan Anda dan TemuClient akan mencarikan provider yang relevan.

CTA: `Buat Requirement`

---

## 19. Loading

Prefer layout-matched skeletons.

Avoid full-page centered spinners except for exceptional blocking processes.

---

## 20. Error States

Required:
- validation error;
- permission denied;
- not found;
- server error;
- network error;
- expired opportunity;
- unavailable introduction;
- removed company.

Every error state should include a recovery action.

---

## 21. Responsive Behavior

### Desktop
- full sidebar;
- multi-column layouts;
- split detail + intelligence panel;
- kanban board;
- contextual drawers.

### Tablet
- collapsible sidebar;
- reduced columns;
- modal/drawer for secondary details.

### Mobile
- bottom navigation;
- stacked cards;
- bottom sheets;
- no unchanged desktop tables;
- opportunity intelligence shown in expandable sections.

---

## 22. Accessibility

Target WCAG AA.

Required:
- keyboard navigation;
- semantic elements;
- visible focus states;
- labels;
- aria attributes;
- adequate contrast;
- error announcements;
- reduced motion;
- minimum 44px touch targets on mobile.

---

## 23. Copy Guidelines

Language: Bahasa Indonesia with standard B2B English terminology when clearer.

Good:

> Opportunity baru dengan kecocokan 94%.

Bad:

> Amazing! AI menemukan lead super keren untuk kamu! 🚀

Tone:
- concise;
- professional;
- useful;
- calm;
- no exaggerated claims.

---

## 24. Design QA Checklist

Before marking a screen complete:

- Is the primary CTA obvious?
- Is the most important signal visible above the fold?
- Is verification represented?
- Are sensitive fields hidden when required?
- Does the screen work without color alone?
- Is mobile behavior defined?
- Is there an empty state?
- Is there a loading state?
- Is there an error state?
- Are focus states present?
- Is typography consistent?
- Is information density appropriate?
- Is there a clear next action?

---

## 25. Related Documents

- `SYSTEM_DESIGN.md`
- `DATABASE_SCHEMA.md`
- `API_CONTRACT.md`
- `USER_FLOWS.md`
- `SCREEN_SPECIFICATIONS.md`
