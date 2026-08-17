# TemuClient User Flows

**Version:** 1.0  
**Primary Principle:** Need → Match → Introduction → Meeting → Deal

---

## 1. User Roles

- Buyer
- Provider Owner/Admin
- Provider Sales
- Organization Member
- Platform Admin

---

## 2. Provider Onboarding

```mermaid
flowchart TD
    A[Register] --> B[Choose Cari Client]
    B --> C[Create Company]
    C --> D[Add Services]
    D --> E[Set Project Range]
    E --> F[Select Industries]
    F --> G[Add Portfolio]
    G --> H[Add Team / Capacity]
    H --> I[Verification]
    I --> J[Provider Dashboard]
```

### Exit Criteria

Provider can access opportunity feed when:
- organization exists;
- at least one service exists;
- profile reaches minimum completeness;
- account is not suspended.

---

## 3. Buyer Onboarding

```mermaid
flowchart TD
    A[Register] --> B[Choose Cari Vendor]
    B --> C[Create Company]
    C --> D[Verify Business Email / Domain]
    D --> E[Create First Requirement]
    E --> F[Buyer Dashboard]
```

Goal: move buyer to first requirement with minimum friction.

---

## 4. Create Requirement

```mermaid
flowchart TD
    A[Requirements] --> B[Buat Requirement]
    B --> C[Describe Need in Natural Language]
    C --> D[AI Analyze]
    D --> E[Clarifying Questions]
    E --> F[Structured Requirement Draft]
    F --> G[Review & Edit]
    G --> H{Complete?}
    H -- No --> F
    H -- Yes --> I[Publish]
    I --> J[Intent Score Calculation]
    J --> K[Matching]
```

Rules:
- AI never auto-publishes.
- Buyer must review final structured output.
- Draft autosaves.

---

## 5. Opportunity Matching

```mermaid
flowchart TD
    A[Opportunity Published] --> B[Candidate Provider Selection]
    B --> C[Deterministic Match Scoring]
    C --> D[Store OpportunityMatch]
    D --> E[Rank Providers]
    E --> F[Buyer Match List]
    E --> G[Provider Opportunity Feed]
```

Provider sees safe data only.

---

## 6. Provider Opportunity Review

```mermaid
flowchart TD
    A[Opportunity Feed] --> B[Open Opportunity]
    B --> C[Review Problem / Budget / Timeline]
    C --> D[Review Match Score]
    D --> E[Review Verification]
    E --> F{Interested?}
    F -- No --> G[Save / Ignore]
    F -- Yes --> H[Request Introduction]
```

---

## 7. Request Introduction

```mermaid
flowchart TD
    A[Request Introduction] --> B[Select Relevant Portfolio]
    B --> C[Write Fit Summary]
    C --> D[Write Proposed Approach]
    D --> E[Optional AI Assist]
    E --> F[Review]
    F --> G[Submit]
    G --> H[Status REQUESTED]
    H --> I[Buyer Notification]
```

Rules:
- AI content must be reviewed.
- Duplicate active request is blocked.

---

## 8. Buyer Reviews Provider

```mermaid
flowchart TD
    A[Buyer Notification] --> B[Open Introduction]
    B --> C[Review Match]
    C --> D[Review Portfolio]
    D --> E[Review Verification]
    E --> F{Decision}
    F -- Accept --> G[Introduction ACCEPTED]
    F -- Decline --> H[Introduction DECLINED]
```

---

## 9. Accept Introduction

```mermaid
flowchart TD
    A[Buyer Accepts] --> B[Transaction Starts]
    B --> C[Set ACCEPTED]
    C --> D[Create Conversation]
    D --> E[Create Participants]
    E --> F[Create Deal]
    F --> G[Audit]
    G --> H[Notify Provider]
    H --> I[Unlock Allowed Contact Context]
```

---

## 10. Messaging

```mermaid
flowchart TD
    A[Accepted Introduction] --> B[Conversation]
    B --> C[Send Message]
    C --> D[Recipient Notification]
    D --> E{Need Meeting?}
    E -- Yes --> F[Schedule Meeting]
    E -- No --> B
```

---

## 11. Meeting Flow

```mermaid
flowchart TD
    A[Schedule Meeting] --> B[Choose Date/Time]
    B --> C[Add Meeting Link]
    C --> D[Invite Participants]
    D --> E[Meeting Scheduled]
    E --> F[AI Meeting Prep]
    F --> G[Conduct Meeting]
    G --> H[Mark Completed]
    H --> I[Add Notes]
    I --> J[AI Discovery Analysis]
    J --> K[Update Deal]
```

---

## 12. Deal Progression

```mermaid
flowchart LR
    A[INTRODUCTION] --> B[DISCOVERY]
    B --> C[PROPOSAL]
    C --> D[NEGOTIATION]
    D --> E[WON]
    A --> F[LOST]
    B --> F
    C --> F
    D --> F
```

Each transition:
- validates;
- writes stage history;
- creates activity;
- emits analytics event.

---

## 13. Proposal Flow

```mermaid
flowchart TD
    A[Deal Detail] --> B[Create Proposal]
    B --> C[Draft]
    C --> D[Optional AI Outline]
    D --> E[Review]
    E --> F[Submit]
    F --> G[Buyer Notification]
    G --> H{Outcome}
    H -- Accepted --> I[Proposal ACCEPTED]
    H -- Rejected --> J[Proposal REJECTED]
    H -- Revision --> C
```

---

## 14. Deal Won

```mermaid
flowchart TD
    A[Negotiation] --> B[Mark Won]
    B --> C[Final Value]
    C --> D[Set WON]
    D --> E[Stage History]
    E --> F[Analytics]
    F --> G[Review Eligibility]
    G --> H[Success State]
```

---

## 15. Deal Lost

```mermaid
flowchart TD
    A[Active Deal] --> B[Mark Lost]
    B --> C[Choose Lost Reason]
    C --> D[Optional Note]
    D --> E[Set LOST]
    E --> F[Stage History]
    F --> G[Analytics]
```

---

## 16. Buyer Provider Comparison

```mermaid
flowchart TD
    A[Requirement Detail] --> B[Matched Providers]
    B --> C[Shortlist]
    C --> D[Compare up to 3]
    D --> E[Review Match Factors]
    E --> F[Open Provider]
    F --> G[Request / Accept Introduction]
```

Comparison must not reduce provider selection to price only.

---

## 17. Verification Flow

```mermaid
flowchart TD
    A[Verification Page] --> B[Select Verification Type]
    B --> C[Submit Evidence]
    C --> D[Status PENDING]
    D --> E[Admin Queue]
    E --> F{Decision}
    F -- Approve --> G[VERIFIED]
    F -- Reject --> H[REJECTED]
    F -- More Info --> I[Request Information]
    I --> C
```

---

## 18. Admin Opportunity Review

```mermaid
flowchart TD
    A[Admin Opportunity Queue] --> B[Open Opportunity]
    B --> C[Review Buyer]
    C --> D[Review Requirement]
    D --> E[Review Budget / Intent]
    E --> F[Review Risk Flags]
    F --> G{Decision}
    G -- Verify --> H[Verification Record]
    G -- Reject --> I[Reject / Return]
    G -- Flag --> J[Flagged]
    H --> K[Audit Log]
    I --> K
    J --> K
```

---

## 19. Opportunity Expiration

```mermaid
flowchart TD
    A[ACTIVE Opportunity] --> B{expiresAt reached?}
    B -- No --> A
    B -- Yes --> C[EXPIRED]
    C --> D[Hide from Feed]
    D --> E[Notify Buyer]
    E --> F{Extend?}
    F -- Yes --> G[Update expiresAt]
    G --> H[ACTIVE]
```

---

## 20. Provider Daily Workflow

```mermaid
flowchart TD
    A[Dashboard] --> B[Review New Matches]
    A --> C[Review Next Best Actions]
    B --> D[Open High Match Opportunity]
    D --> E[Request Introduction]
    C --> F[Follow Up Active Deal]
    F --> G[Schedule Meeting]
    G --> H[Update Deal]
```

Dashboard should answer: **What should I do today to generate a client?**

---

## 21. Buyer Daily Workflow

```mermaid
flowchart TD
    A[Dashboard] --> B[Review Requirement Status]
    B --> C[Review New Provider Matches]
    C --> D[Shortlist]
    D --> E[Accept Introduction]
    E --> F[Message Provider]
    F --> G[Schedule Meeting]
```

---

## 22. Permission Exceptions

### Provider cannot:
- see buyer private contact before accepted introduction;
- request introduction without eligible opportunity;
- modify buyer requirement;
- access other provider introductions.

### Buyer cannot:
- inspect provider internal deal notes;
- access provider sales analytics;
- alter provider profile.

### Admin can:
- inspect moderation data;
- not impersonate business actions without explicit audited support flow.

---

## 23. Mobile Flow Rules

Mobile prioritizes:
- opportunity cards;
- requirement status;
- messaging;
- next action;
- meeting.

Complex comparison and admin tables may use responsive stacked views.

---

## 24. Article Publication

```mermaid
flowchart TD
    A[Admin prepares Markdown] --> B[Upload .md]
    B --> C[Validate file and frontmatter]
    C --> D[Parse and calculate reading time]
    D --> E[Upsert Article by slug]
    E --> F[Create audit record]
    F --> G{Status PUBLISHED?}
    G -- No --> H[Keep out of public discovery]
    G -- Yes --> I[Render public article]
    I --> J[Include in sitemap, RSS, and llms.txt]
```

Rules:
- only `SUPER_ADMIN` and `ADMIN` mutate;
- `DRAFT` is the default and requires human review;
- uploading the same slug updates rather than duplicates;
- raw HTML is skipped;
- public queries never return draft or archived content.

---

## 25. Related Documents

- `SCREEN_SPECIFICATIONS.md`
- `API_CONTRACT.md`
- `SYSTEM_DESIGN.md`
