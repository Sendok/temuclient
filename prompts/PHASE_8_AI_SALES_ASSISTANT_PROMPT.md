# TemuClient V1 — Phase 8 AI Sales Assistant


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

Improve salesperson effectiveness using contextual, task-oriented AI without making AI autonomous.

Approved features:

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

# IMPORTANT PRODUCT RULE

Do NOT build a generic blank ChatGPT clone as the primary experience.

AI should be embedded into real business tasks.

# AI PROVIDER ABSTRACTION

Implement:

```ts
interface AIProvider {
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>
  generateObject<T>(input: GenerateObjectInput<T>): Promise<T>
  embed?(input: EmbedInput): Promise<EmbedResult>
}
```

Support configurable providers.

Do not hard-code all logic to one vendor.

# AI EXECUTION LOG

Implement/complete:

```text
AIExecution
```

Store:
- feature;
- provider;
- model;
- token counts if available;
- latency;
- cost if available;
- status;
- entity reference.

Avoid raw sensitive prompt storage unless necessary.

# FEATURE 1 — OPPORTUNITY SUMMARY

Input:
- provider-safe opportunity data.

Output:
- concise problem;
- scope;
- budget/timeline;
- risks;
- recommended review points.

# FEATURE 2 — MATCH EXPLANATION

Input:
- deterministic factor scores.

Output:
- human-readable explanation.

AI must not change Match Score.

# FEATURE 3 — MEETING PREP

Route:

```text
/app/meetings/[id]/prepare
```

Output:
```text
Company Snapshot
Opportunity Summary
Likely Pain Points
Stakeholders
Recommended Discovery Questions
Relevant Portfolio
Potential Objections
Desired Outcome
```

# FEATURE 4 — DISCOVERY ANALYSIS

Input:
- user-provided meeting notes.

Output:
```text
Pain Points
Buying Signals
Decision Makers
Budget
Timeline
Risks
Next Best Action
```

# FEATURE 5 — FOLLOW-UP DRAFT

Generate draft only.

Never send automatically.

User must review/edit.

# FEATURE 6 — PROPOSAL OUTLINE

Generate:
```text
Problem
Objective
Recommended Solution
Scope
Timeline
Deliverables
Commercial Structure
Assumptions
```

Draft only.

# FEATURE 7 — DEAL HEALTH

Return structured:

```text
score 0–100
positiveSignals[]
risks[]
nextBestAction
```

Do not present false precision as certainty.

Label as assistance/inference.

# AI SALES PAGE

Route:

```text
/app/ai-sales
```

Use task cards/modules:
- Meeting Prep
- Opportunity Analysis
- Discovery Analysis
- Follow-Up
- Proposal Outline
- Deal Coach

# AUTHORIZATION

Every AI request must verify access to referenced:
- opportunity;
- meeting;
- deal;
- conversation.

# RATE LIMITS

Implement per user/org/plan foundation.

# FAILURE HANDLING

If provider unavailable:
- show actionable error;
- preserve user input;
- allow retry;
- do not break core sales workflow.

# REQUIRED APIs

```text
POST /api/v1/ai/opportunity-summary
POST /api/v1/ai/match-explanation
POST /api/v1/ai/meeting-prep
POST /api/v1/ai/discovery-analysis
POST /api/v1/ai/follow-up
POST /api/v1/ai/proposal-outline
POST /api/v1/ai/deal-health
```

# TESTS

Unit:
- structured output validation;
- feature permission checks;
- fallback handling.

Integration:
- meeting prep;
- deal health;
- follow-up draft;
- AIExecution log;
- rate limiting.

Do not assert exact natural-language strings; assert structure and business rules.

# ACCEPTANCE CRITERIA

```text
AI is contextual
AI never auto-sends
structured output is validated
core score remains deterministic
AI access is authorized
AI execution is logged
failure does not block core workflow
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
TemuClient V1 — Phase 8 AI Sales Assistant

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
