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

## 2026-07-13 — Switched from direct Anthropic API to OpenRouter, one key
Consolidated on a single `OPENROUTER_API_KEY` instead of per-vendor keys.
Model choice became a per-task decision instead of one mandated model:
`REPLY_MODEL` = openai/gpt-4.1-mini, `KB_MODEL` = deepseek/deepseek-v4-pro,
`VOICE_MODEL` = google/gemini-2.5-pro (all user-chosen; verified live against
OpenRouter's `/api/v1/models` catalog since two initially-named slugs didn't
exist — "claude-opus-4-8" is a direct-Anthropic-only id, and "opus 4.1 mini"
was a typo for openai/gpt-4.1-mini). Client moved from `@anthropic-ai/sdk` to
the `openai` package pointed at OpenRouter's OpenAI-compatible endpoint
(client.ts); `output_config`/`response_format` json_schema mode carried over
directly on the reply-generation call.
One real capability loss: Anthropic's server-side `web_fetch` tool (used by
buildKnowledgebase to fetch a business's homepage and follow up to 4 same-site
links) has no OpenRouter equivalent — OpenRouter's `:online` plugin does
general web *search*, not targeted URL fetch-and-crawl. Replaced with a plain
server-side `fetch()` of the given URL only (build-knowledgebase.ts
`fetchPageText`), stripped to text and capped at 20k chars, single page, no
link-following. Chosen over the `:online` plugin (less precise, per-search
cost) and over keeping a second Anthropic-only key for just this one call
(defeats the one-key goal). If a business's key facts live on a linked
About/Menu page rather than the homepage, the KB builder will now miss them —
acceptable for now; falls back to the paste-text KB path.
Two follow-on fixes from the review of this switch: (a) the KB fetch now
throws a "paste the info instead" error when the page yields < 200 chars of
text (JS-rendered SPAs return an empty shell to a plain `fetch()`); (b) both
replacement summarization models are REASONING models whose thinking tokens
are billed against `max_tokens` — deepseek-v4-pro defaults to "high" effort
and gemini-2.5-pro's reasoning is MANDATORY (undisableable). The budgets
inherited from non-thinking Opus (KB 4000, voice 1500) risked thinking
exhausting the budget → truncated/empty markdown → thrown "no text". Raised to
KB 8000 / voice 4000. Optional future cost tweak: disable reasoning on the KB
call via OpenRouter's `reasoning:{enabled:false}` (not done — it's outside the
OpenAI SDK's param types and would need a cast).

## 2026-07-13 — KB redesigned to 8 sections; recovery policy is founder-only
Research-driven: replies referencing real specifics beat templates (72% of
consumers distrust AI-sounding replies); review responses are crawled, so ONE
naturally-woven service/location phrase is a local-SEO lever (stuffing is
penalized); negative replies should offer the business's real make-it-right
action. New sections: "Signature Language" (model-sourced) and "When Something
Goes Wrong" (founder-authored, merged verbatim by lib/replydesk/kb-sections.ts,
NEVER model-generated — the KB prompt forbids it and URL/paste rebuilds
re-merge it so it survives). Reply prompt: at most ONE signature/neighborhood
phrase per reply; negatives reference the real recovery action, phrased as an
action, never contact info (hard gate still enforces). No DB migration — the
KB stays one markdown column. Spec:
docs/superpowers/specs/2026-07-13-kb-prompt-redesign-design.md.

## 2026-07-14 — Business hard-delete from the detail page
Added a "Danger zone" on the business detail page: type-the-exact-name to arm,
then `deleteBusinessAction` (self-authenticating) hard-deletes the row; reviews
cascade via the existing FK, so no migration. The action catches DB errors and
RETURNS `{ error }` (shown in the card) so that `redirect("/admin")` stays
outside any try/catch, per Next 16's redirect rules. Businesses only — reviews
stay non-deletable (they are the similarity gate's audit trail). Soft delete is
deferred to the CRM phases (spec 2026-07-14-crm-evolution-design.md).

## 2026-07-14 — Phase 1: shared passcode → Supabase Auth (two founder accounts)
Auth now uses @supabase/ssr with a SERVER-ONLY publishable key (no
NEXT_PUBLIC_: the browser never talks to Supabase; login/logout/validation
all run in server actions and proxy.ts). Sessions are validated with
getClaims() (JWT signature check) — never getSession() — in proxy.ts
(refresh only, matcher /admin/:path*), the (protected) layout (guard), and
requireUser() (first line of every action, replacing requireSession). The
passcode module (lib/replydesk/auth.ts) and its tests are deleted;
REPLYDESK_PASSCODE retires. All action inputs are now zod-parsed
(app/admin/schemas.ts) immediately after requireUser(). The profiles table
(migration 0002) holds display names for attribution; RLS on, zero policies
(service-role access only), rows seeded manually while self-signup is off.

## 2026-07-15 — Phase 2: CRM shell (clients, sidebar, tabbed record)
businesses rows are now client records: status (lead|active|paused|churned,
default lead, check-constrained; migration 0003) plus contact fields, edited
on the client Overview tab (updateClientDetailsAction). Routes moved to
/admin/clients with nested-route tabs (Overview | ReplyDesk — later phases
add folders, not edits); /admin/businesses/:id 307-redirects via
next.config.ts; /admin redirects to the client list until Phase 4's
dashboard. Hard delete is now LEAD-ONLY, enforced server-side in
deleteBusinessAction via lib/crm/status.canDeleteBusiness — non-leads are
set to churned instead (record + history kept). Admin shell uses shadcn/ui
(base-nova registry; sidebar/table/badge copied in) themed to existing
tokens; marketing-shared files (ui/button, ui/accordion, globals.css)
untouched. Bad/deleted client ids now render a friendly 404: a nullable
findBusiness (.maybeSingle) lets route code call notFound(), caught by a
boundary at app/admin/(protected)/clients/not-found.tsx — placed at the
PARENT (not the [id]) segment because a segment's own not-found.js nests
inside its layout and so cannot catch that layout's own guard throw.

## 2026-07-31 — Phase 3: activity timeline (activities table, app-level writers)
activities (0004) is the one-table timeline: notes are type 'note'; reply
posts, KB/voice saves (kb_updated, metadata.section distinguishes), and real
status changes write from the actions themselves (no DB triggers — testable
writers, per the vision spec). Only notes are deletable, enforced by the db
helper's type='note' filter, not just the UI. body is null except note text
and task_completed's task-title snapshot; other labels derive from
type+metadata (lib/crm/timeline.activityLabel). Writer failures propagate
loudly. Timestamps render in America/New_York (user decision 2026-07-31,
spec 2026-07-31-phases-3-5-design.md).

## 2026-07-31 — Phase 4: tasks & today-dashboard
tasks (0005): business_id nullable (general to-dos), assignee null = "either
of us". Tasks are hard-deletable (user decision 2026-07-31) — a mis-created
task must not force a bogus task_completed timeline entry. Completing a
client-linked task writes task_completed (title snapshot in body); reopening
leaves that entry (history is fact) and writes nothing. Due-date math runs in
America/New_York via lib/crm/dates (todayInTimeZone); dashboard = today +
overdue only; undated tasks live in /admin/tasks' Anytime section. /admin is
now the today-dashboard, replacing the Phase-2 redirect.

## 2026-07-31 — Phase 4 fix wave: real completeTask transition, revalidation ordering
Whole-branch review of Phase 4 found three seam-level bugs, all fixed together
(no second wave planned). (1) completeTask now only writes/returns a row when
`.eq("status","open")` actually matched (maybeSingle, so already-done returns
null instead of an unconditional single()) — completing an already-done task
(reopen→complete cycles, two founders racing the same task, or the checkbox
bug below) no longer inserts a second permanent task_completed activity.
(2) setTaskStatusAction now calls revalidateTaskSurfaces immediately after
completeTask succeeds, BEFORE the task_completed insertActivity call, so a
failing activity write (which still throws — that propagation is
intentional) can no longer leave the checkbox showing unchecked against a
task that is actually done in the database. (3) TaskForm's createTaskAction
call is now wrapped in try/catch, matching TaskItem's existing pattern —
requireUser() throws rather than redirecting on an expired session, and that
rejection was escaping the transition to the nearest error boundary,
losing the page and the typed title. Also: listRecentActivities now maps a
missing joined business to null (was ""), matching listAllTasks, so the two
helpers agree and a renderer can't mistake an empty string for real data;
and due dates render via the new lib/crm/dates.formatDueDate (string-part
parsing, not `new Date(str).toLocaleDateString()`, which would reintroduce
the UTC-shift bug this file exists to prevent).

## 2026-07-31 — Phase 5: ReplyDesk cross-client dashboard
/admin/replydesk = recent posted replies (20, joined business names) +
"needs attention" for ACTIVE clients only: latest review row is an unposted
draft, and/or no posted reply in 7+ days / ever (signals + window
user-approved 2026-07-31). The draft signal reads only the latest row per
client because draft rows are an accumulating audit trail (regenerations).
Heuristic is pure (lib/crm/attention.buildAttention); review readers live in
lib/replydesk/db (reviews are ReplyDesk domain). Read-only page — no new
actions.

## 2026-07-31 — Phase 5 fix wave: listReviewMeta ordering, null-join convention, nullsFirst
Whole-branch review of Phase 5 found six issues, all fixed together (no second
wave planned). (1) listReviewMeta now orders by created_at desc — it was
unbounded AND unordered, and it is the entire input to buildAttention on a
force-dynamic page; any future row cap (PostgREST db-max-rows, or a defensive
.limit()) would otherwise truncate arbitrarily and silently compute a wrong
verdict for both A5 signals. (2) recentPostedAcrossClients now maps a missing
business join to null, not "" — the Phase 4 fix wave deliberately rejected the
""-for-missing-join convention (see above) so listRecentActivities/listAllTasks
agree; this reader had reintroduced it. The dashboard page renders the null
case as plain "Unknown client" text, matching the Phase-4 dashboard's pattern.
(3) Both recentPostedAcrossClients and recentPostedReplies now order posted_at
desc with nullsFirst:false — Postgres defaults DESC to nulls-first, and
0001_replydesk.sql never ties status='posted' to a non-null posted_at, so
without this a null-postedAt posted row would sort to the top of "Recent
replies" with no date shown. (4) ReviewMeta moved from lib/crm/attention.ts to
lib/replydesk/types.ts (beside Review) — it's a projection of the reviews
table, so lib/replydesk/db.ts should own it rather than importing its own
table's row shape from lib/crm; attention.ts now imports it type-only and
re-exports it. (5) The star-rating glyphs on /admin/replydesk now render
behind aria-hidden with an aria-label text alternative, matching every other
icon on this branch. (6) lib/crm/CLAUDE.md's timestamp-comparison invariant
now notes it applies to timestamptz columns only — due_date is a Postgres
date column (bare YYYY-MM-DD, no offset), so dates.ts/tasks.ts's string
comparisons there are correct, not a violation.
