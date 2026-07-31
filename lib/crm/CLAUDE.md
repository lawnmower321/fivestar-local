# lib/crm — CRM domain

Pure, dependency-injected CRM logic. Sibling of lib/replydesk with the same
rules (see docs/superpowers/specs/2026-07-14-crm-evolution-design.md).

INVARIANTS
- Nothing in this tree imports from `next/*` or constructs clients. Plain TS.

MAP
- status.ts — client status enum (STATUSES, ClientStatus), isClientStatus,
  canDeleteBusiness (the lead-only hard-delete rule).
- types.ts — ACTIVITY_TYPES/ActivityType, Activity, Profile (the timeline's
  shared shapes).
- db.ts — activity + profile db helpers (insertActivity, listActivities,
  deleteNoteActivity, listProfiles), injected SupabaseClient like
  lib/replydesk/db.ts.
- timeline.ts — activityLabel: one-line display text per activity.

TESTS: tests/crm/
