# Phase 1 — Supabase Auth Migration: Design

**Date:** 2026-07-14
**Status:** Approved (user, 2026-07-14)
**Parent:** docs/superpowers/specs/2026-07-14-crm-evolution-design.md (rev 2) — Phase 1
**Branch:** crm-phase-1

## Problem

The `/admin` console is guarded by one shared passcode (SHA-256 of
`REPLYDESK_PASSCODE` in an `rd_session` cookie). The CRM phases need to know
*which* founder acted — task assignees, activity authors — and a shared
passcode can't say. Phase 1 replaces it with real Supabase Auth accounts and
lays the attribution foundation (`profiles`).

## Decisions (user-approved, 2026-07-14)

| Decision | Choice |
|---|---|
| Publishable key exposure | **Server-only env var** (`SUPABASE_PUBLISHABLE_KEY`, no `NEXT_PUBLIC_`). The browser never talks to Supabase; auth runs in server actions + proxy. Preserves the "secrets server-side only" rule. |
| zod scope | **Retrofit all 9 existing actions** in this phase (their first line changes anyway), plus the new auth inputs. |

## Verified-current facts (Supabase live docs, 2026-07-14)

- Server-side session validation MUST use `supabase.auth.getClaims()` — it
  verifies the JWT signature against the project's published keys.
  `getSession()` is spoofable in server code and must not be used there.
- Next 16 renamed middleware to `proxy.ts`; Supabase's Next.js guide ships an
  `updateSession(request)` helper for it. Gotcha carried verbatim: run no
  code between `createServerClient(...)` and the `getClaims()` call.
- `@supabase/ssr`'s cookie adapter is the `getAll`/`setAll` pair.
- Modern keys are `sb_publishable_…` / `sb_secret_…`; legacy anon/service
  keys work until end of 2026. The project already uses an `sb_secret_…`
  service key.

## Architecture

Two Supabase clients with disjoint jobs:

- **Data client** (existing, unchanged): `getDb()` in `lib/replydesk/db.ts`,
  service-role key, bypasses RLS. All business/review/profile ROW access.
- **Auth client** (new): `createServerClient(SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY, { cookies: { getAll, setAll } })` from
  `@supabase/ssr`, bound to Next's cookie jar. It only signs in/out and
  validates sessions. Because it needs `next/headers`/`next/server`, it
  lives in the app shell — `lib/replydesk/` keeps its no-`next/*` invariant.

`lib/replydesk/auth.ts` (passcode hashing) and `tests/replydesk/auth.test.ts`
are DELETED. `REPLYDESK_PASSCODE` and the `rd_session` cookie disappear.

## Components

### 1. `supabase/migrations/0002_profiles.sql`

```sql
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null
);
alter table profiles enable row level security;
-- No policies: server code uses the service-role key (bypasses RLS) and
-- the browser never talks to the data API. RLS-on/zero-policies = locked.
```

No signup trigger — self-signup is disabled and the two founder rows are
seeded by hand (see Human setup). Applied via Supabase MCP
`apply_migration` (keeps remote migration history in sync from 0002 on);
run MCP `get_advisors` after.

### 2. `app/admin/auth-client.ts` — auth-client factory

```ts
export async function getAuthClient(): Promise<SupabaseClient>
```

`createServerClient` wired to `await cookies()` with the `getAll`/`setAll`
adapter (in Server Components `setAll` may be called during render and throw
— swallow per Supabase's documented pattern, proxy handles refresh). Reads
`SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY`; throws if either is unset.

### 3. `proxy.ts` (repo root) — session refresh only

- `export const config = { matcher: '/admin/:path*' }` — the marketing site
  never executes it.
- Standard `updateSession` shape: create client with request/response
  cookie plumbing, immediately `await supabase.auth.getClaims()` (no code in
  between), return the response carrying refreshed cookies.
- Proxy REFRESHES; it does not guard. Redirect-to-login stays in the
  `(protected)/` layout, so the guard remains impossible to bypass by route
  misconfiguration (unchanged philosophy from the passcode design).

### 4. `app/admin/require-user.ts` — replaces `require-session.ts`

```ts
export async function requireUser(): Promise<{ id: string }>
```

`getAuthClient()` → `getClaims()` → invalid/absent ⇒ `throw new
Error("unauthorized")` (same contract as today); valid ⇒ `{ id: claims.sub }`.
A pure helper `userFromClaims(claims): { id: string } | null` holds the
extraction/validation logic so it is unit-testable without Next.

### 5. `(protected)/layout.tsx` — guard + logout

- Guard: `getAuthClient()` → `getClaims()`; absent ⇒ `redirect("/admin/login")`.
- Nav gains a **Log out** button (form posting to `logoutAction`).

### 6. Login page + auth actions

- `app/admin/login/page.tsx`: email + password fields (same visual shell as
  today), `?error=1` shows "Wrong email or password." — one generic message,
  no user-enumeration detail.
- `loginAction` (in the login page file, like today's inline `login`):
  zod-parse `{ email, password }` → `getAuthClient().auth.signInWithPassword`
  → failure ⇒ `redirect("/admin/login?error=1")`; success ⇒ cookies are set
  by the client's adapter ⇒ `redirect("/admin")`. Exempt from `requireUser`
  (it IS the door).
- `logoutAction` (in `app/admin/actions.ts`): `requireUser()` first, then
  `auth.signOut()`, then `redirect("/admin/login")`.

### 7. zod on all server actions

- Dependency: `zod` (pinned). Schemas are pure TS.
- One schema per action input, defined beside the actions
  (`app/admin/schemas.ts`), parsed immediately after `requireUser()`:
  `createBusiness` (name nonempty trimmed; reviewUrl optional http(s) URL —
  replaces the current regex), `saveKb`/`saveVoice` (id uuid, md string),
  `buildKbFromUrl` (url http(s)), `buildKbFromText` (raw nonempty),
  `extractVoice` (pastReplies nonempty), `generateReply` (businessId uuid,
  rating int 1–5, reviewer string, reviewText nonempty),
  `markPosted` (two uuids), `deleteBusiness` (uuid), `login` (email
  email-format, password nonempty).
- Parse failures throw zod's error; client components already render thrown
  action errors in their existing error paths.

## Data flow

1. Any `/admin/*` request → `proxy.ts` refreshes the token (if any).
2. Page render → `(protected)/layout` `getClaims()` → invalid ⇒ login.
3. Login submit → `signInWithPassword` → `sb-*` cookies set → `/admin`.
4. Every server action → `requireUser()` → zod-parse → work via `getDb()`.

## Error handling

- Bad credentials → generic "Wrong email or password." via `?error=1`.
- Expired/absent session in an action → `"unauthorized"` thrown (existing
  client error paths render it); next page navigation redirects to login.
- Missing env (`SUPABASE_PUBLISHABLE_KEY`) → factory throws at first use,
  same style as `getDb()`.
- zod parse failure → thrown, surfaced by existing error rendering.

## Testing

- Unit (vitest, no network): `userFromClaims` (valid claims ⇒ id; null/
  missing sub ⇒ null) and every zod schema (accept + reject cases per
  field rule). Passcode tests deleted with their module.
- Manual E2E (human, live env): login wrong/right, session persists across
  refresh, logout, protected page redirects when signed out, an action
  (e.g. save KB) succeeds signed-in — and the existing features still work
  end-to-end after the requireUser/zod retrofit.
- Full suite + `tsc` + lint + build must stay green (test count changes:
  −4 passcode tests, + new schema/claims tests).

## Env & dependencies

- `.env.example` / `.env.local`: ADD `SUPABASE_PUBLISHABLE_KEY`
  (server-only), REMOVE `REPLYDESK_PASSCODE`.
- ADD deps (pinned, lockfile committed): `@supabase/ssr`, `zod`.

## Human setup tasks (dashboard/console, not code)

1. Supabase dashboard → Auth: disable self-signup (email provider stays on).
2. Create the two founder accounts (email + password) in the dashboard.
3. Insert their `profiles` rows (SQL editor or MCP `execute_sql`):
   `insert into profiles (id, display_name) values ('<auth-uid>', 'Brian'), ('<auth-uid-2>', '<partner>');`
4. Create/copy the publishable key (API Keys tab) → `SUPABASE_PUBLISHABLE_KEY`
   in `.env.local`.
5. Delete `REPLYDESK_PASSCODE` from `.env.local`.

## Out of scope (deliberate)

- Password reset flow (dashboard-driven while the team is two people), MFA.
- `businesses` status/contact columns, CRM nav/shell, shadcn/ui — Phase 2.
- Any `profiles` UI (names render in Phase 3's timeline).

## Constraints carried forward

- `lib/**` never imports `next/*`; auth client lives in the app shell.
- Every server action authenticates in its first statement (`requireUser`).
- Secrets server-side only; never `NEXT_PUBLIC_`; never commit `.env.local`.
- `docs/replydesk/DECISIONS.md` append-only (this phase appends its entry).
- Marketing-site files stay out of commits (path-scoped `git add` only).
