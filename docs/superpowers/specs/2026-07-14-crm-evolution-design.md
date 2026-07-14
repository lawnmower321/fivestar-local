# CRM + Workflow Manager Evolution — Vision & Roadmap

**Date:** 2026-07-14 (rev 2, same day — gap-analysis amendments folded in)
**Status:** Approved (user, 2026-07-14; amendments approved same day)
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
| Admin UI kit | **shadcn/ui**, admin surface only (rev 2) |

## Architecture

### One record, not two

A `businesses` row IS the client record. No parallel `clients` table, no
data migration — the CRM adds columns and satellite tables around what
exists. `lib/replydesk/` stays the pure domain layer; CRM domain logic gets
sibling modules under `lib/` following the same pure/DI, no-`next/*` rule.

### Data model (additive)

- `businesses` gains: `status text` (check-constrained to `lead | active |
  paused | churned`, default `'lead'`), `contact_name text`,
  `contact_email text`, `contact_phone text`.
- New `profiles`: `id uuid` PK, FK → `auth.users(id)` on delete cascade,
  `display_name text not null`. `auth.users` lives in the unexposed `auth`
  schema, so anything that must display "who did this" joins `profiles`
  instead. While self-signup is disabled there is NO signup trigger —
  profile rows are created in the same manual step as the two founder
  accounts (avoids a `security definer` trigger function entirely).
- New `activities`: `id`, `business_id` FK → businesses on delete cascade,
  `user_id` FK → **profiles(id)** on delete set null (history survives an
  account removal), `type text` (check-constrained to `note | reply_posted
  | status_change | kb_updated | task_completed`), `body text`,
  `metadata jsonb` nullable (structured payloads: `status_change` stores
  `{from, to}`, `reply_posted` stores `{review_id}`), `created_at`.
  Free-form notes are activities of type `note` — one timeline, one table.
- New `tasks`: `id`, `business_id` nullable FK → businesses on delete
  cascade (some to-dos aren't client-specific; a deleted client takes its
  tasks with it), `assignee` nullable FK → profiles(id) on delete set null
  (null = "either of us"), `title text`, `due_date date` nullable (not everything has a
  deadline), `status text` (check-constrained `open | done`), `created_by`
  nullable FK → profiles(id) on delete set null (same
  history-survives-account-removal rule as activities), `created_at`,
  `completed_at`.
- Access model unchanged: all DB access is server-side via the service-role
  key inside authenticated server actions. The browser never talks to
  Supabase directly, so RLS remains defense-in-depth (enable it on every
  new table including `profiles`, no anon policies).
- Migration hygiene (rev 2): `0001` was pasted into the SQL editor, so the
  remote migration-history table doesn't track it. From Phase 1 on, apply
  migrations via Supabase MCP `apply_migration` so remote history matches
  `supabase/migrations/`, and run MCP `get_advisors` after every migration
  (standing plan step, like tsc/lint).

### Auth (Phase 1, before anything needing attribution)

- Supabase Auth via `@supabase/ssr`, two founder email+password accounts,
  self-signup disabled.
- **Session refresh lives in `proxy.ts`** (rev 2): Next 16 renamed
  middleware to `proxy.ts`; `@supabase/ssr` needs a request-time hook that
  can SET cookies to refresh expiring tokens (Server Components cannot).
  A root `proxy.ts` with `matcher: '/admin/:path*'` refreshes the session;
  the marketing site never runs it. The `(protected)/` route group still
  owns the *guard* (redirect to login); proxy owns *refresh* only.
- `requireSession()` becomes `requireUser(): Promise<{ id: string }>` — same
  first-statement contract in every server action; the returned id stamps
  `activities.user_id`, `tasks.assignee`, `tasks.created_by`. Display names
  come from `profiles` at render time, never from the session.
- The passcode login page is replaced; `REPLYDESK_PASSCODE` retires.
- Password reset: skipped initially — with two founders, a forgotten
  password is reset from the Supabase dashboard. Revisit (custom SMTP,
  reset flow) only if the team grows.
- Input validation (rev 2): adopt **zod** for server-action inputs from
  Phase 1 on — one schema per action, parsed immediately after
  `requireUser()`. (zod is pure TS; fine inside `lib/**`.)

### Navigation & routes

```
/admin                      Dashboard: today's + overdue tasks, recent activity
                            (until Phase 4 ships it: redirect → /admin/clients)
/admin/clients              Client list (status, name, contact)
/admin/clients/[id]         Tabbed record: Overview | ReplyDesk | Tasks | Timeline
/admin/replydesk            Cross-client ReplyDesk dashboard (recent replies,
                            clients needing attention)
/admin/tasks                Workflow view: open tasks by due date, overdue flagged
```

- The ReplyDesk tab on a client is the EXISTING KB builder + reply
  workspace, relocated — not rewritten.
- `/admin/businesses/[id]` → `/admin/clients/[id]` via `redirects()` in the
  Next config (one config entry, not app code).
- All routed pages live under `app/admin/(protected)/` per the established
  auth-guard pattern.
- UI kit (rev 2): the CRM shell (sidebar, tabs, tables, dialogs) is built
  with **shadcn/ui**, themed to the existing `gblue`/`gred`/`ggreen`
  tokens. It is copy-in code confined to the admin surface; marketing-site
  components stay hand-rolled as they are.

### Deleting clients (rev 2)

The Phase-0 hard delete (type-the-name danger zone) is right while records
are test data. From Phase 2 on, a business with real history must not be
one typo away from destruction: the danger zone hard-deletes ONLY
businesses with `status = 'lead'`; anything further along must be set to
`churned` (record kept, timeline intact) — the delete button is replaced by
that guidance for non-lead clients. The guard is enforced in
`deleteBusinessAction` itself (status checked server-side before the
delete), not just hidden in the UI — same philosophy as actions
self-authenticating. Soft-delete/archive beyond `churned` remains
deliberately out of scope.

## Phased roadmap

Each phase produces working software and gets its own spec + plan when
started. Order is fixed; contents of later phases may be refined.

| Phase | Delivers | Depends on |
|---|---|---|
| 0 | Merge `replydesk` branch; **business delete** (spec: 2026-07-14-business-delete-design.md) | — |
| 1 | Supabase Auth migration: accounts + `profiles`, `proxy.ts` session refresh, `requireUser`, zod on action inputs, retire passcode | 0 |
| 2 | CRM shell: shadcn/ui sidebar nav, `businesses` client columns + migration, client list, tabbed client detail (Overview + relocated ReplyDesk tab), lead-only delete guard, `/admin` → clients redirect | 1 |
| 3 | Activity timeline: `activities` table, writers hooked into existing reply-posted / KB-saved / status-change actions, notes UI, Timeline tab | 2 |
| 4 | Tasks & follow-ups: `tasks` table, Tasks tab + `/admin/tasks`, `/admin` today-dashboard (replaces the redirect) | 3 |
| 5 | `/admin/replydesk` cross-client dashboard | 2 (richer after 3) |

### Phase 1 human setup tasks (dashboard, not code)

1. Disable self-signup in Supabase Auth settings.
2. Create the two founder accounts (email + password) and their `profiles`
   rows (same migration/seed step).
3. No SMTP work — password resets are dashboard-driven for now.

## Future features (roadmap-listed, deliberately undesigned)

- **Sales pipeline** — stage board (lead → contacted → demo → signed →
  onboarded). `businesses.status` + `activities` type `status_change`
  (with its `{from, to}` metadata) already record the raw history a
  pipeline view would need.
- **Task reminders / notifications** — a workflow manager that never pings
  you relies on someone opening the dashboard. Natural add: Vercel cron +
  email digest of due/overdue tasks (needs an email provider, e.g. Resend).
  Nothing in the `tasks` model blocks it.
- **GBP API auto-posting** — replaces copy-paste posting once Google
  approves the application (docs/replydesk/GBP-API.md).
- **Automatic review ingestion** — pull new Google reviews per client
  instead of manual paste; feeds the ReplyDesk dashboard's "needs
  attention" list.
- **Billing / invoicing tracking** — per-client; likely activities-adjacent.

None of these are blocked by the data model above.

## Alternatives considered and rejected (rev 2)

- **Adopting an OSS CRM (Twenty, Monica, …):** heavyweight multi-tenant
  platforms; would abandon evolve-in-place, re-solve auth, and still need
  ReplyDesk bolted on. Thin-and-owned wins for two founders whose
  differentiator IS ReplyDesk-inside-the-CRM.
- **DB triggers for activity writing:** app-level writers in server actions
  stay testable with the existing pure/DI pattern; triggers hide logic in
  the DB.
- **TanStack Table / react-hook-form / client state library / MFA:** all
  overkill at this scale; revisit only if the constraints change.

## Constraints carried forward (binding on every phase)

- `lib/**` modules never import `next/*`; clients injected (pure/DI).
- Every server action authenticates in its first statement.
- Secrets are server-side only; never `NEXT_PUBLIC_`, never commit
  `.env.local`.
- `docs/replydesk/DECISIONS.md` is append-only.
- Marketing-site files stay out of admin/CRM commits (path-scoped `git add`
  only).
- New tables ship with RLS enabled and check-constrained enum columns; run
  Supabase advisors after every migration.
