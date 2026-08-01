# lib/crm — CRM domain

Pure, dependency-injected CRM logic. Sibling of lib/replydesk with the same
rules (see docs/superpowers/specs/2026-07-14-crm-evolution-design.md).

INVARIANTS
- Nothing in this tree imports from `next/*` or constructs clients. Plain TS.
- All "today"/"overdue" comparisons go through todayInTimeZone(FOUNDER_TZ)
  (dates.ts) — never `new Date().toISOString().slice(0,10)`, which flips at
  UTC midnight instead of America/New_York.
- Timestamp comparisons (attention.ts) go through epoch ms
  (`new Date(x).getTime()`), never string comparison: PostgREST serializes
  `timestamptz` as `"...+00:00"` while `toISOString()` produces `"...000Z"` —
  equal instants, unequal strings, so a naive `<` on the raw strings
  misclassifies boundary cases. This applies to `timestamptz` columns only.
  `due_date` is a Postgres `date` column, serialized as a bare `YYYY-MM-DD`
  with no offset — dates.ts/tasks.ts deliberately compare those as strings
  (ISO-format YYYY-MM-DD strings sort correctly lexically), which is correct,
  not a violation of this invariant.

MAP
- status.ts — client status enum (STATUSES, ClientStatus), isClientStatus,
  canDeleteBusiness (the lead-only hard-delete rule).
- types.ts — ACTIVITY_TYPES/ActivityType, Activity, Profile (timeline's
  shared shapes); TaskStatus, Task, TaskWithBusiness (tasks' shapes —
  businessId/assignee/dueDate all nullable).
- dates.ts — FOUNDER_TZ ("America/New_York"); todayInTimeZone, isOverdue,
  isDueToday — the one place due-date/overdue math is computed; formatDueDate
  (parses the YYYY-MM-DD string's own parts — never `new Date(str)`, which
  parses as UTC midnight and renders a day early in FOUNDER_TZ).
- db.ts — activity + profile db helpers (insertActivity, listActivities,
  deleteNoteActivity, listProfiles, listRecentActivities — missing joined
  business maps to null, matching listAllTasks) and task db helpers
  (createTask, listTasksForBusiness, listAllTasks, completeTask, reopenTask,
  deleteTask), injected SupabaseClient like lib/replydesk/db.ts. completeTask
  is a real state transition (`.eq("status","open")` + maybeSingle): it
  returns the row only when open->done actually happened, null when the task
  was already done, so callers don't write a duplicate task_completed
  activity on a no-op re-completion.
- tasks.ts — TaskBuckets, bucketTasks: one overdue/today/upcoming/anytime/done
  bucketing rule shared by the client tab, /admin/tasks, and the dashboard.
- timeline.ts — activityLabel: one-line display text per activity.
- attention.ts — STALE_DAYS (7), buildAttention(clients, reviews, now,
  staleDays?): pure "needs attention" heuristic (latest review row is an
  unposted draft, and/or no posted reply in staleDays+ days / ever); callers
  pass ACTIVE clients only. ReviewMeta itself is defined in
  lib/replydesk/types.ts (it's a reviews-table projection, ReplyDesk domain)
  and imported here type-only; re-exported from this module for convenience.

TESTS: tests/crm/
