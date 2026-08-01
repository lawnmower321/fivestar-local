# Phases 3–5: Activity Timeline, Tasks & Dashboard, ReplyDesk Dashboard — Design

**Date:** 2026-07-31
**Status:** Approved (user, 2026-07-31 — heuristic, deletion policy, and timezone
answers recorded below)
**Parent:** 2026-07-14-crm-evolution-design.md (vision spec; its data model and
constraints are binding). docs/ROADMAP.md fixes the A3/A4/A5 scope.
**Plans:** one per phase in docs/superpowers/plans/
(2026-07-31-phase3-activity-timeline.md, …-phase4-tasks-dashboard.md,
…-phase5-replydesk-dashboard.md). Phases ship in order; each is independently
shippable working software.

## Decisions resolved in this spec (user-answered 2026-07-31)

| Question | Decision |
|---|---|
| A5 "needs attention" signals | (1) latest reply draft never posted; (2) active client with no posted reply in 7+ days (or ever) |
| Staleness window | 7 days |
| Corrections policy | Tasks hard-deletable; `note` activities hard-deletable; all other activity types immutable. Deletions write nothing to the timeline |
| Timezone for due-date math | `America/New_York` — "today" and "overdue" are computed in ET |

## Decisions made by analysis (flagged to user 2026-07-31, unobjected)

- Saving the **voice guide** writes a `kb_updated` activity too (no
  `voice_updated` type); `metadata` records `{section: "kb" | "voice"}`.
- `status_change` is written **only when the status actually changed** —
  `updateClientDetailsAction` fetches the business first and compares.
  Contact-detail-only edits write no activity.
- **Reopening** a done task is allowed (checkbox toggles both ways). The old
  `task_completed` activity stays — it is a historical fact. Reopening writes
  no activity.
- `task_completed` activities are written **only for client-linked tasks**;
  completing a general to-do writes nothing (there is no timeline for it).
- Undated open tasks appear in an **"Anytime"** section on `/admin/tasks`,
  never on the dashboard (dashboard = today + overdue only, per vision spec).
- Both migrations ship **indexes on every FK** plus the query-shaped indexes
  below (Supabase advisors flag unindexed FKs).
- No `task_created` activity type — the vision spec's enum is closed; widening
  a check constraint later is a one-line migration.
- Activity-writer failures **propagate** (the action errors even though the
  primary write landed). Internal tool: a silently missing timeline entry is
  worse than a loud error.
- `activities.body` is nullable. It is set for `note` (the note text) and
  `task_completed` (task-title snapshot, so history survives task deletion);
  null for the other types, whose display text derives from `type` +
  `metadata` (`lib/crm/timeline.ts` `activityLabel`).

## Data model (matches vision spec; concrete DDL)

**Migration `0004_activities.sql` (Phase 3):**

```sql
create table activities (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  type text not null check (type in
    ('note','reply_posted','status_change','kb_updated','task_completed')),
  body text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
alter table activities enable row level security;
create index activities_business_created_idx on activities (business_id, created_at desc);
create index activities_user_idx on activities (user_id);
```

**Migration `0005_tasks.sql` (Phase 4):**

```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade,
  assignee uuid references profiles(id) on delete set null,
  title text not null,
  due_date date,
  status text not null default 'open' check (status in ('open','done')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table tasks enable row level security;
create index tasks_business_idx on tasks (business_id);
create index tasks_assignee_idx on tasks (assignee);
create index tasks_created_by_idx on tasks (created_by);
create index tasks_status_due_idx on tasks (status, due_date);
```

Both applied via Supabase MCP `apply_migration` (name matches the repo
filename stem), `get_advisors` run after each. RLS on, zero policies —
service-role access only, same as `profiles`.

## Metadata shapes (fixed)

| type | body | metadata |
|---|---|---|
| `note` | note text (required) | null |
| `reply_posted` | null | `{ review_id: uuid }` |
| `status_change` | null | `{ from: ClientStatus, to: ClientStatus }` |
| `kb_updated` | null | `{ section: "kb" \| "voice" }` |
| `task_completed` | task title snapshot | null |

## Module layout

- `lib/crm/types.ts` — `ACTIVITY_TYPES`/`ActivityType`, `Activity`,
  `Profile`, `TaskStatus`, `Task`, `TaskWithBusiness` (cross-client activity
  reads return the inline type `Activity & { businessName: string }`).
- `lib/crm/db.ts` — Supabase helpers for activities, tasks, profiles (same
  fakeDb-testable builder style as `lib/replydesk/db.ts`).
- `lib/crm/timeline.ts` — `activityLabel(a)` pure display-text builder.
- `lib/crm/dates.ts` — `FOUNDER_TZ = "America/New_York"`,
  `todayInTimeZone(tz, now?)` (Intl `en-CA` → `YYYY-MM-DD`),
  `isOverdue(dueDate, today)`, `isDueToday(dueDate, today)`.
- `lib/crm/tasks.ts` — `bucketTasks(tasks, today)` →
  `{ overdue, today, upcoming, anytime, done }` (used by all three task
  surfaces; overdue/upcoming sorted by due date ascending).
- `lib/crm/attention.ts` — `STALE_DAYS = 7`, `ReviewMeta`, `AttentionItem`,
  `buildAttention(clients, reviews, now, staleDays?)` pure heuristic.
- `lib/replydesk/db.ts` gains review-domain readers used by A5:
  `recentPostedAcrossClients(db, limit)` (join `businesses(name)`) and
  `listReviewMeta(db, businessIds)`.
- Writers live in `app/admin/actions.ts` (app-level, per vision spec — no DB
  triggers), calling `insertActivity` after the primary write succeeds.

## Routes & UI

- `clients/[id]/timeline/page.tsx` — Timeline tab (Phase 3): note composer on
  top, activities newest-first (limit 50), author display names via
  `listProfiles`, per-type icon + `activityLabel`, delete button on notes only.
- `clients/[id]/tasks/page.tsx` — Tasks tab (Phase 4): create form
  (title, due date, assignee: "Either of us" | founder names) + bucketed list
  with complete/reopen checkbox and delete.
- `(protected)/tasks/page.tsx` — cross-client workflow view (Phase 4):
  Overdue / Today / Upcoming / Anytime sections, client name column, create
  form with optional client select.
- `(protected)/page.tsx` — dashboard replaces the redirect (Phase 4): today's
  + overdue tasks (with complete checkboxes) + 10 most recent activities
  across clients (business name + author + label).
- `(protected)/replydesk/page.tsx` — Phase 5: "Needs attention" card
  (client, reasons, link to that client's ReplyDesk tab) + recent posted
  replies across clients (20, newest first).
- Tab order (vision spec): Overview | ReplyDesk | Tasks | Timeline. Phase 3
  adds Timeline, Phase 4 inserts Tasks before it.
- Sidebar: Phase 4 adds Dashboard (`/admin`, exact-match active) and Tasks;
  Phase 5 adds ReplyDesk.
- All new pages: `export const dynamic = "force-dynamic"` (established
  admin-surface pattern).

## A5 heuristic (exact)

For **active** clients only, computed from `ReviewMeta` rows:

1. **Pending draft:** the client's most recent review row (by `created_at`)
   has `status = 'draft'` → "Latest reply draft was never posted".
2. **Stale:** no review row with `posted_at` at all → "No reply ever posted";
   otherwise newest `posted_at` older than 7 days → "No reply posted in 7+
   days".

A client appears once with all reasons that apply; zero reasons = not listed.
Draft rows are an audit trail (regenerations accumulate) — that is why the
signal uses only the *latest* row, never a count of drafts.

## Constraints carried forward (binding, from vision spec + roadmap)

- `lib/**` never imports `next/*`; clients injected (pure/DI).
- Every server action: `requireUser()` first statement, zod parse second.
- Secrets server-side only. RLS on for all new tables, no anon policies.
- `docs/replydesk/DECISIONS.md` append-only; entry per shipped phase.
- Marketing-site files never share a commit with admin/CRM work.
- Migrations via MCP `apply_migration`; `get_advisors` after every migration.
- This repo's Next.js is 16.2.10 — consult `node_modules/next/dist/docs/`
  before using unfamiliar APIs.
