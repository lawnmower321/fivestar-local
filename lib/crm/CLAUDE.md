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
  isDueToday — the one place due-date/overdue math is computed.
- db.ts — activity + profile db helpers (insertActivity, listActivities,
  deleteNoteActivity, listProfiles, listRecentActivities) and task db
  helpers (createTask, listTasksForBusiness, listAllTasks, completeTask,
  reopenTask, deleteTask), injected SupabaseClient like lib/replydesk/db.ts.
- tasks.ts — TaskBuckets, bucketTasks: one overdue/today/upcoming/anytime/done
  bucketing rule shared by the client tab, /admin/tasks, and the dashboard.
- timeline.ts — activityLabel: one-line display text per activity.

TESTS: tests/crm/
