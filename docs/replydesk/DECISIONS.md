# ReplyDesk Decision Log (append-only)

Format: `## YYYY-MM-DD — <decision>` then 1–3 lines of why. Never edit old entries.

## 2026-07-10 — Internal console first, multi-tenant data model
Two founders are the only users until MRR justifies self-serve. Businesses are
rows, not tenants with auth, so the upgrade path is additive.

## 2026-07-10 — Copy-paste posting until GBP API approval
Programmatic posting requires Google Business Profile API access (application
submitted separately — see GBP-API.md). Everything else works without it.

## 2026-07-10 — Admin auth guard lives in a route group, not a header check
The originally sketched `app/admin/layout.tsx` guard let the login page
render unauthenticated by reading `headers().get("x-invoke-path")`. That
header does not appear anywhere in `node_modules/next` (searched the full
package) and is undocumented in `node_modules/next/dist/docs` — the shipped
`headers.md` reference lists only standard request headers (e.g.
`user-agent`, `authorization`) with no mention of an invoke-path header, and
Next's own documented pattern for path-based checks in this version is
`usePathname()` in a Client Component (see `redirect.md`'s Client Component
example), not a magic header available to Server Components. Relying on it
risked either failing open (guard never triggers) or a redirect loop (guard
always triggers, including on `/admin/login` itself).

## 2026-07-10 — Server actions self-authenticate via requireSession()
The (protected) route-group layout only guards PAGE rendering; server-action
POST endpoints are reachable without it and there is no middleware. So every
action in `app/admin/actions.ts` now calls `await requireSession()` as its
first statement (new `app/admin/require-session.ts`, which reads `cookies()`
and calls `isValidSession`). That file lives in the app shell, not
`lib/replydesk/`, to preserve the "no `next/*` in lib" invariant. The login
action stays exempt.

## 2026-07-10 — Contact-info gate broadened (bare domains, intl phones, phrases)
The HARD contact-info gate was NA/English-centric. Broadened: (a) bare-domain
detection now matches ANY 2+ letter TLD (incl. multi-part like co.uk), not just
.com/.net/.org/.io/.co, so tonyspizza.shop / salon.app / shop.co.uk / menu.us
are caught; the TLD letters must sit immediately after the dot so ordinary
sentence punctuation ("great. Our…", "9 p.m.") is not flagged. (b) A separate
international-phone pattern catches "+country groups" like +44 20 7946 0958 (the
literal + avoids date/count false positives). (c) Contact phrases added: DM us,
message us, find us online, our site, our website. This is an un-bypassable
moderation gate, so it errs slightly toward over-blocking by design. Existing
clean fixtures still return null (verified in tests/replydesk/gates.test.ts).

## 2026-07-10 — Recent-reviews log shows posted-only; drafts stay transient
Every generate inserts a `draft` review row (audit trail), so regenerating used
to clutter the "Recent reviews" list. Chosen fix: the detail page filters the
displayed log to `status === 'posted'`; drafts live only in the transient
workspace card. The DB insert is kept as the audit trail, and the similarity
gate already reads posted-only via `recentPostedReplies`, so nothing regresses.

## 2026-07-10 — Hard-fails intentionally retry the full 3 attempts
The generate loop retries on ANY gate failure, including hard-fails
(contact-info). This is intentional: a regeneration is another chance at a
postable reply and costs a few cents only in the rare hard-fail case. Behavior
unchanged; the mis-named test was renamed and now asserts `attempts === 3`.

## 2026-07-10 — Malformed model output is a failed attempt, not a fatal error
`generateReply` now wraps `JSON.parse` per attempt: a non-JSON response records
a flagged result ("model returned malformed output") and continues the loop, so
after MAX_ATTEMPTS it returns a flagged GeneratedReply for human review instead
of throwing and killing the retry loop.

Instead: `login/` lives directly under `app/admin/` with no guard, and every
other admin route lives under the route group `app/admin/(protected)/`,
whose `layout.tsx` unconditionally redirects to `/admin/login` when
`isValidSession` is false. Route groups add no URL segment, so `/admin` and
`/admin/businesses/[id]` are unaffected, but only routes inside the group are
ever subject to the guard — no path string matching required, and no way for
the check to silently no-op.

## 2026-07-10 — Task 6 business list page placed under `(protected)/`
Per the route-group guard above, the business list page (brief's literal
`app/admin/page.tsx`) was created at `app/admin/(protected)/page.tsx` instead,
so the auth guard actually protects it. Server actions stayed at
`app/admin/actions.ts` (route groups don't change import paths), so
`@/app/admin/actions` still resolves for this page and for Tasks 7–8.

## 2026-07-10 — Task 7 business detail page placed under `(protected)/`
Same reasoning as Task 6: the brief's literal `app/admin/businesses/[id]/page.tsx`
was created at `app/admin/(protected)/businesses/[id]/page.tsx` so the guard
protects it. Route groups add no URL segment, so `/admin/businesses/{id}`
still resolves correctly for links from the list page and `createBusinessAction`.

## 2026-07-10 — Task 9 context-integrity pass: one stale path fixed, no code changes
Full check suite passed as-is (26/26 tests, lint clean, build compiles with
`/admin`, `/admin/login`, `/admin/businesses/[id]` present) — no regressions,
so no code changes were made. Re-reading every module `CLAUDE.md` against its
folder found exactly one drift: `lib/replydesk/ai/prompts/CLAUDE.md` said the
gates live at `../gates/`, but from `lib/replydesk/ai/prompts/` the correct
relative path is `../../gates/` (prompts → ai → replydesk → gates). Fixed the
doc; no other `CLAUDE.md` (`lib/replydesk/`, `gates/`, `ai/`, `app/admin/`,
`components/admin/`) had a false statement against the shipped code.
