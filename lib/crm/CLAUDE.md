# lib/crm — CRM domain

Pure, dependency-injected CRM logic. Sibling of lib/replydesk with the same
rules (see docs/superpowers/specs/2026-07-14-crm-evolution-design.md).

INVARIANTS
- Nothing in this tree imports from `next/*` or constructs clients. Plain TS.
- All "today"/"overdue" comparisons go through todayInTimeZone(FOUNDER_TZ)
  (dates.ts) — never `new Date().toISOString().slice(0,10)`, which flips at
  UTC midnight instead of America/New_York.

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

TESTS: tests/crm/
