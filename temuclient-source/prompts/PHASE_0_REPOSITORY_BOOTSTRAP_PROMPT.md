# TemuClient V1 — Phase 0 Repository Bootstrap

Before making code changes:

1. Read `/AGENTS.md`.
2. Read `/MASTER_DEVELOPMENT_PLAN.md`.
3. Read all files under `/docs`.
4. Inspect the repository.
5. Do not implement business modules yet.
6. Produce a concise setup plan before coding.

# GOAL

Prepare a clean local development foundation for TemuClient V1.

# TARGET STACK

```text
Next.js 16
App Router
TypeScript strict
Tailwind CSS
shadcn/ui
Geist
PostgreSQL
Prisma ORM
Redis
Docker Compose
```

# IMPLEMENT

- initialize or validate Next.js project;
- TypeScript strict mode;
- Tailwind;
- shadcn/ui foundation;
- linting;
- environment validation;
- PostgreSQL connection;
- Prisma initialization;
- Redis connection abstraction;
- Docker Compose for PostgreSQL + Redis;
- `.env.example`;
- base source directory structure;
- test runner foundation;
- README local setup instructions.

Do not implement:
- full auth;
- opportunity;
- matching;
- introductions;
- messaging;
- deals;
- AI;
- billing.

# REQUIRED VALIDATION

Run:
```text
lint
typecheck
tests if configured
production build
```

# ACCEPTANCE CRITERIA

```text
app boots
PostgreSQL connects
Redis connects
Prisma can generate/migrate
environment validation works
lint passes
typecheck passes
build passes
```

# FINAL REPORT

Return:

```text
IMPLEMENTATION REPORT

Phase:
TemuClient V1 — Phase 0 Repository Bootstrap

Status:
COMPLETE / PARTIAL / BLOCKED

Completed:
-

Not completed:
-

Changed files:
-

Infrastructure:
-

Commands executed:
-

Lint:
-

Typecheck:
-

Tests:
-

Build:
-

Known issues:
-

Recommended next phase:
TemuClient V1 — Phase 1 Foundation
```
