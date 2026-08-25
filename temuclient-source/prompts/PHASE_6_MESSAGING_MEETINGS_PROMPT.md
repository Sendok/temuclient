# TemuClient V1 — Phase 6 Messaging & Meetings


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

Allow buyer and provider participants with an accepted Introduction to communicate and schedule a discovery meeting.

Target:

```text
Accepted Introduction
→ Conversation
→ Message
→ Schedule Meeting
→ Conduct / Complete Meeting
```

# REQUIRED DATA MODELS

Implement or complete:

```text
Conversation
ConversationParticipant
Message
Meeting
MeetingParticipant
Notification
```

# CONVERSATION RULES

A conversation is accessible only to:
- authorized participants;
- involved buyer/provider organizations;
- platform admin only under audited moderation/support access if supported.

Conversation should contain context:
- opportunity;
- introduction;
- deal if available.

# MESSAGING UI

Route:

```text
/app/messages
```

Desktop:
```text
Conversation List
Conversation Thread
Context Sidebar
```

Context sidebar:
- opportunity;
- company;
- deal stage if available;
- next action;
- meeting.

Mobile:
- list → full-screen thread.

# MESSAGES

Support:
- text;
- reply-to;
- edited timestamp if editing supported;
- soft deletion if moderation strategy requires it.

Do not implement unnecessary rich text.

# UNREAD STATE

Use `lastReadAt` or equivalent.

Show unread counts.

# REALTIME

If a realtime transport is already available, use it.

Otherwise:
- implement reliable polling/revalidation foundation;
- keep transport abstraction clean for later WebSocket/SSE upgrade.

Do not overcomplicate V1.

# MEETINGS

Route:

```text
/app/meetings
```

Views:
- Upcoming
- Past

Fields:
- title;
- start/end;
- timezone;
- provider;
- URL;
- participants;
- status.

Statuses:
```text
SCHEDULED
COMPLETED
CANCELLED
NO_SHOW
```

Actions:
```text
Join
Reschedule
Cancel
Mark Completed
```

# MEETING ACCESS

Only involved participants can see private meeting data.

# TIMEZONE

Store UTC.

Display in user timezone.

Default:
```text
Asia/Jakarta
```

# NOTIFICATIONS

Create in-app notifications for:
- new message;
- meeting scheduled;
- meeting rescheduled;
- meeting cancelled.

Email delivery may be enabled if provider exists.

# REQUIRED APIs

```text
GET /api/v1/conversations
GET /api/v1/conversations/:id
GET /api/v1/conversations/:id/messages
POST /api/v1/conversations/:id/messages

GET /api/v1/meetings
POST /api/v1/meetings
GET /api/v1/meetings/:id
PATCH /api/v1/meetings/:id
POST /api/v1/meetings/:id/cancel

GET /api/v1/notifications
POST /api/v1/notifications/:id/read
POST /api/v1/notifications/read-all
```

# TESTS

Unit:
- conversation permissions;
- meeting permissions;
- timezone helpers.

Integration:
- send message;
- unauthorized conversation denial;
- schedule meeting;
- reschedule;
- cancel;
- notification creation.

E2E:
```text
Accepted Introduction
→ Provider sends message
→ Buyer reads/replies
→ Meeting scheduled
→ Both see meeting
→ Meeting completed
```

# ACCEPTANCE CRITERIA

```text
messages persist
participants are authorized
unread state works
meeting schedule persists
timezone rendering is correct
notifications work
mobile messaging is usable
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
TemuClient V1 — Phase 6 Messaging & Meetings

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
