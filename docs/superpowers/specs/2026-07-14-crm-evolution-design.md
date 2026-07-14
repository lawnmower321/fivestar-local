# CRM + Workflow Manager Evolution — Vision & Roadmap

**Date:** 2026-07-14
**Status:** Approved (user, 2026-07-14)
**Kind:** Vision spec. Each phase below gets its own detailed spec → plan →
implementation cycle when it comes up; this document fixes the architecture,
data model, and order so those phases don't fight each other.

## Vision

The `/admin` ReplyDesk console evolves into the founders' client-management
app: an interactive CRM and workflow manager. ReplyDesk (KB builder + reply
workspace) becomes one section of that app — "our side of the ReplyDesk
tool" — alongside client records, tasks, and an activity timeline.

## Decisions (user-approved, 2026-07-14)

| Decision | Choice |
|---|---|
| App shape | **Evolve this repo in place** — one Next.js app, one Vercel deploy, marketing site untouched |
| CRM scope | Client records, tasks & follow-ups, activity timeline. **No sales pipeline** (future feature) |
| Auth | **Real Supabase Auth accounts** (two founders) replace the shared passcode |
| ReplyDesk placement | **Both**: top-level ReplyDesk dashboard AND a ReplyDesk tab on each client record |

## Architecture

### One record, not two

A `businesses` row IS the client record. No parallel `clients` table, no
data migration — the CRM adds columns and satellite tables around what
exists. `lib/replydesk/` stays the pure domain layer; CRM domain logic gets
sibling modules under `lib/` following the same pure/DI, no-`next/*` rule.

### Data model (additive)

- `businesses` gains: `status text` (lead | active | paused | churned,
  default 'lead'), `contact_name text`, `contact_email text`,
  `contact_phone text`.
- New `activities`: `id`, `business_id` FK → businesses (cascade),
  `user_id` (auth.users), `type text` (`note` | `reply_posted` |
  `status_change` | `kb_updated` | `task_completed`), `body text`,
  `created_at`. Free-form notes are activities of type `note` — one
  timeline, one table.
- New `tasks`: `id`, `business_id` nullable FK (some to-dos aren't
  client-specific), `assignee` (auth.users), `title text`,
  `due_date date`, `status text` (open | done), `created_by`,
  `created_at`, `completed_at`.
- Access model unchanged: all DB access is server-side via the service-role
  key inside authenticated server actions. The browser never talks to
  Supabase directly, so RLS remains defense-in-depth (enable it on new
  tables, no anon policies).

### Auth (Phase 1, before anything needing attribution)

- Supabase Auth via `@supabase/ssr`, two founder email+password accounts,
  self-signup disabled.
- `requireSession()` becomes `requireUser(): Promise<{ id: string }>` — same
  first-statement contract in every server action; the returned id stamps
  `activities.user_id`, `tasks.assignee`, `tasks.created_by`.
- The passcode login page is replaced; `REPLYDESK_PASSCODE` retires.

### Navigation & routes

```
/admin                      Dashboard: today's + overdue tasks, recent activity
/admin/clients              Client list (status, name, contact)
/admin/clients/[id]         Tabbed record: Overview | ReplyDesk | Tasks | Timeline
/admin/replydesk            Cross-client ReplyDesk dashboard (recent replies,
                            clients needing attention)
/admin/tasks                Workflow view: open tasks by due date, overdue flagged
```

- The ReplyDesk tab on a client is the EXISTING KB builder + reply
  workspace, relocated — not rewritten.
- `/admin/businesses/[id]` redirects to `/admin/clients/[id]` so old links
  survive.
- All routed pages live under `app/admin/(protected)/` per the established
  auth-guard pattern.

## Phased roadmap

Each phase produces working software and gets its own spec + plan when
started. Order is fixed; contents of later phases may be refined.

| Phase | Delivers | Depends on |
|---|---|---|
| 0 | Merge `replydesk` branch; **business delete** (spec: 2026-07-14-business-delete-design.md) | — |
| 1 | Supabase Auth migration: accounts, `requireUser`, retire passcode | 0 |
| 2 | CRM shell: sidebar nav, `businesses` client columns + migration, client list, tabbed client detail (Overview + relocated ReplyDesk tab) | 1 |
| 3 | Activity timeline: `activities` table, writers hooked into existing reply-posted / KB-saved / status-change actions, notes UI, Timeline tab | 2 |
| 4 | Tasks & follow-ups: `tasks` table, Tasks tab + `/admin/tasks`, `/admin` today-dashboard | 3 |
| 5 | `/admin/replydesk` cross-client dashboard | 2 (richer after 3) |

## Future features (roadmap-listed, deliberately undesigned)

- **Sales pipeline** — stage board (lead → contacted → demo → signed →
  onboarded). `businesses.status` + `activities` type `status_change`
  already record the raw history a pipeline view would need.
- **GBP API auto-posting** — replaces copy-paste posting once Google
  approves the application (docs/replydesk/GBP-API.md).
- **Automatic review ingestion** — pull new Google reviews per client
  instead of manual paste; feeds the ReplyDesk dashboard's "needs
  attention" list.
- **Billing / invoicing tracking** — per-client; likely activities-adjacent.

None of these are blocked by the data model above.

## Constraints carried forward (binding on every phase)

- `lib/**` modules never import `next/*`; clients injected (pure/DI).
- Every server action authenticates in its first statement.
- Secrets are server-side only; never `NEXT_PUBLIC_`, never commit
  `.env.local`.
- `docs/replydesk/DECISIONS.md` is append-only.
- Marketing-site files stay out of admin/CRM commits (path-scoped `git add`
  only).
