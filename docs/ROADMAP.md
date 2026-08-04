# FiveStar Local — Roadmap (approved 2026-07-27)

> **STATUS 2026-08-01 — all three tracks are complete.** Track A (CRM
> Phases 3–5), Track B (brand; B2 skipped by decision), and Track 0
> (production readiness) are all done and deployed. The only remaining
> work is the parked launch backlog at the bottom of this file, every item
> of which is blocked on something external rather than on code. Per-item
> evidence is inline below. This document is now a record, not a queue.

**Scope:** everything remaining across the product: CRM build-out (Track A),
brand & design (Track B), production readiness (Track 0), and the parked
launch backlog. Written to be executable by someone with no memory of the
planning conversation.

**Context in one paragraph:** FiveStar Local sells NFC tap-to-review cards to
local businesses ($29/mo Growth plan includes ReplyDesk, an AI review-reply
console). The marketing site is live on Vercel; the `/admin` CRM (Phases 0–2
of `docs/superpowers/specs/2026-07-14-crm-evolution-design.md`) is merged and
deployed. Launch is blocked on physical cards/materials — not code — so the
founders are building the internal CRM (Phases 3–5) while the design track
produces the cards.

**Model workflow (user preference):** planning/writing in Fable 5; switch to
Opus 4.8 or Sonnet 5 for execution phases, flagging the switch at each phase
boundary.

---

## Current state (verified 2026-08-01)

- `master` = `529bfee`, in sync with `origin/master`, working tree clean (git).
- Supabase: `businesses`, `reviews`, `profiles`, `activities` (0004),
  `tasks` (0005), and the reconciliation column (0006) are all live with
  RLS enabled (Supabase MCP).
- `profiles` has **2 rows** — both founder accounts are seeded, so Phase 3
  activity attribution has real authors (Supabase MCP, `select count(*)`).
- Production `/admin` is working. Requesting it returns the login page
  (`x-matched-path: /admin/login`) rather than a 500, which proves the
  `(protected)` layout guard ran `requireUser()` → `getAuthClient()` — a
  factory that throws when its env vars are unset. `SUPABASE_URL` and
  `SUPABASE_PUBLISHABLE_KEY` are therefore set in production, superseding
  the 2026-07-27 note below. Zero runtime errors on the route in 7 days.
- **Not verified:** `SUPABASE_SERVICE_ROLE_KEY` and `OPENROUTER_API_KEY`
  are only exercised behind a logged-in session, so they can't be checked
  from outside. A single successful founder login exercising one client's
  ReplyDesk tab would close this.

<details><summary>Superseded 2026-07-27 state (kept for provenance)</summary>

- `master` = `c55855d`. The 2026-07-26 deploy initially failed because
  `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` were believed unset on
  Vercel; `c55855d` worked around it with `force-dynamic` on `/admin`.
  Resolved — see the live check above.
- `profiles` had 0 rows; founder accounts unseeded. Resolved (0.2).
- Working tree had uncommitted `components/site/*` tweaks and untracked
  `.claude/`, `.mcp.json`, `scripts/`, `skills-lock.json`. Resolved (0.3).

</details>

## Assumptions ledger

| # | Assumption | If wrong |
|---|---|---|
| 1 | Untracked tooling files (`.claude/`, `.mcp.json`, `skills-lock.json`, `scripts/`) stay untracked/gitignored | Commit them as tooling config instead — review `.mcp.json` for secrets first |
| 2 | The three dirty `components/site/*` tweaks are wanted and get a small marketing commit | Discard them (`git checkout --`) |
| 3 | Vercel env vars for Supabase + OpenRouter are absent (inferred from the failed build), not merely absent at build time | Skip 0.1; verify `/admin` works in prod and move on |
| 4 | Brand direction: evolve the existing look (keep type/voice/tap motif, replace Google trademark hexes in own-brand chrome with an owned palette) | Run a from-scratch identity exploration in Canva before B2 |
| 5 | Card printing vendor/specs unknown — B2 targets generic print-ready output (PDF/X, 300dpi, 3mm bleed) | Re-export to the vendor's template |

## Binding constraints (from the approved CRM spec — apply to every phase)

- `lib/**` never imports `next/*`; clients injected (pure/DI).
- Every server action calls `requireUser()` as its **first statement**; zod
  parse immediately after.
- Secrets server-side only — never `NEXT_PUBLIC_`, never commit `.env.local`.
- `docs/replydesk/DECISIONS.md` is append-only.
- Marketing-site files stay out of admin/CRM commits (path-scoped `git add`).
- New tables ship with RLS enabled + check-constrained enum columns; apply
  migrations via Supabase MCP `apply_migration`; run `get_advisors` after
  every migration.
- This repo's Next.js (16.2.10) differs from training data — read
  `node_modules/next/dist/docs/` before writing code (AGENTS.md).

---

## Track 0 — Production readiness & hygiene tail ✅ DONE (2026-08-01)

*Execution: any model; mostly dashboard work.*

**0.1 Vercel env vars.** ✅ Done — the two auth vars are confirmed set in
production by the live `/admin` check in Current state. `scripts/sync-env-to-vercel.ps1`
is the repeatable path for pushing them from `.env.local`. Residual: the
service-role and OpenRouter keys remain unverified from outside (see
Current state). Add to the Vercel project (production +
preview): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY` — values from
`.env.local` / provider dashboards, referenced only as `${ENV_VAR}` (never
pasted into chat or commits).
**Done when:** the deployed `/admin/login` renders and a login attempt
reaches Supabase (wrong-password error is success; a 500 is not).

**0.2 Seed founder accounts.** ✅ Done — `profiles` has 2 rows (Supabase MCP).
In Supabase dashboard: confirm self-signup
disabled; create the two founder auth users; insert their `profiles` rows
(`id` = auth user id, `display_name`). No signup trigger — manual is the
approved pattern.
**Done when:** `profiles` has 2 rows and both founders can log in on the
deployed `/admin`.

**0.3 Hygiene tail.** ✅ Done — working tree clean; `.claude/`, `.mcp.json`,
`skills-lock.json` are gitignored and `scripts/` is tracked as project code
(`cc10a70`). Commit the three `components/site/*` tweaks as one
marketing commit; add `.claude/`, `.mcp.json`, `skills-lock.json` to
`.gitignore` (per assumption 1; check `scripts/` contents — commit if it's
project code, ignore if scratch).
**Done when:** `git status` is clean.

## Track A — CRM evolution ✅ DONE (2026-07-31, merged 2026-08-01)

*All three phases built, reviewed, merged to `master`, and deployed.
Migrations 0004 (activities) and 0005 (tasks) applied; A5's whole-branch
review additionally caught a PostgREST timestamptz-vs-date serialization
hazard, now pinned by a regression test.*

*Execution: switch to Opus 4.8 / Sonnet 5. Each phase gets its own detailed
spec → plan → implementation cycle per the vision spec; the summaries below
fix scope, not implementation detail.*

**A3 — Activity timeline (spec Phase 3).**
Migration `0004_activities`: `id`, `business_id` FK→businesses cascade,
`user_id` FK→profiles set null, `type` check-constrained
`note | reply_posted | status_change | kb_updated | task_completed`,
`body text`, `metadata jsonb` nullable (`status_change` → `{from,to}`,
`reply_posted` → `{review_id}`), `created_at`. RLS on, no anon policies.
App-level writers (no DB triggers) hooked into the existing reply-posted,
KB-saved, and status-change actions; notes UI; Timeline tab on the client
record.
**Done when:** posting a reply / saving a KB / changing status each write an
activity; a note can be added from the UI; the Timeline tab renders them
newest-first with author display names; advisors clean; tests, lint, build
pass.

**A4 — Tasks & dashboard (spec Phase 4).**
Migration `0005_tasks`: `id`, `business_id` nullable FK cascade, `assignee`
nullable FK→profiles set null (null = "either of us"), `title`, `due_date
date` nullable, `status` check-constrained `open | done`, `created_by`
nullable FK set null, `created_at`, `completed_at`. Tasks tab on the client
record; `/admin/tasks` workflow view (open by due date, overdue flagged);
`/admin` becomes the today-dashboard (today's + overdue tasks, recent
activity) replacing the redirect. Completing a task writes a
`task_completed` activity.
**Done when:** tasks can be created/assigned/completed from both surfaces;
`/admin` shows the dashboard; overdue tasks are visually flagged; advisors
clean; tests, lint, build pass.

**A5 — ReplyDesk cross-client dashboard (spec Phase 5).**
`/admin/replydesk`: recent replies across all clients; "clients needing
attention" (heuristic to be specced — e.g. no posted reply in N days,
flagged replies pending).
**Done when:** the page renders live cross-client data and links into each
client's ReplyDesk tab.

## Track B — Brand & design ✅ DONE (2026-08-01, B2 skipped by decision)

*B1 and B3 shipped. **B2 was deliberately skipped** — pre-made NFC cards
are being purchased instead of custom-printed ones, so the card print
design was unnecessary. The owned palette is "Cobalt & Honey"
(`#2749d6` / `#e8a317`); canonical record is `docs/brand.md` +
`docs/brand/fivestar-local-brand-kit.html`.*

*Decision (user-delegated, resolved by analysis 2026-07-27): evolve the
existing brand; do not start from scratch.* Keep: Bricolage Grotesque +
Geist typography, the copy voice, the NFC tap-ripple motif. Replace:
FiveStar's own accent colors, which are currently Google's literal
trademark hexes (`#4285f4 / #34a853 / #fbbc05 / #ea4335`,
`globals.css:133-136`) — unacceptable on printed cards (implied Google
affiliation). Google's colors remain **only** inside components that
depict Google UI (review-showcase, scan-showcase, tap-demo).

**B1 — Brand kit (Canva).** Owned palette (an owned blue distinct from
`#4285f4` + a star-gold accent; neutrals from the current site), logo/
wordmark built on the tap-ripple + five-stars motif, type rules (Bricolage
display / Geist text), applied as a Canva brand kit + a short
`docs/brand.md` recording the tokens.
**Done when:** brand kit exists in Canva; `docs/brand.md` lists hex values,
fonts, logo files; user has approved the look.

**B2 — NFC card print design (the launch blocker).** Front/back card
design from the B1 kit in Canva; print-ready export (PDF, 300dpi, 3mm
bleed per assumption 5). Copy drawn from the existing site voice.
**Done when:** print-ready files are exported and the user has signed off
for ordering.

**B3 — Site alignment pass (small code change, marketing-only commit).**
Introduce owned tokens (e.g. `--color-brand`, `--color-star`) in
`globals.css`; swap the ~22 own-chrome usages of `gblue/gyellow/etc.`
(navbar, pricing, footer, hero, benefits, how-it-works, final-cta,
nfc-card) to them; leave the three Google-UI simulation components on the
Google hexes. Optional: Higgsfield-generated imagery, team photos section.
**Done when:** grep shows Google hexes only in the three simulation
components; build clean; site visually consistent with the printed card.

## Landing Phase 1 — Brand alignment & scroll moments ⏳ AWAITING GATE (2026-08-04)

Branch `design/landing-brand-alignment`. Plan:
`docs/superpowers/plans/2026-08-02-landing-phase1.md` (10 tasks, all executed).
**Not merged to master** — the plan ends at a review gate, by design.

Shipped:
- `lib/brand.ts` + `@theme` tokens + a `<Section>` wrapper that owns ground
  colour and vertical rhythm, so no section hard-codes `bg-*`/`py-*`.
- Four-ground ladder across nine sections: Ink, Paper, Mist, Paper, Ink,
  Mist, Paper, Mist, Cobalt (verified in the browser).
- `CounterStand` — a CSS-3D counter stand seated on a table plane, replacing
  the fictional credit card. `nfc-card.tsx` deleted.
- Hero rebuilt: offset composition on Ink, quick-link strip closing the old
  ~250px dead zone, corner brackets.
- Moment 1 (`review-showcase`): scroll-scrubbed ranking climb with a clamped
  `Odometer`. Moment 2 (`scan-showcase`): the six-business carousel keeps its
  concept but swaps its `setInterval` driver for a CSS-sticky scroll runway;
  timer remains the fallback on mobile and under reduced motion.
- Footer rebuilt (three columns; phone/location/social render only when
  non-null — no invented details) and a no-contracts guarantee badge that
  makes no refund promise.
- Intake form replacing the `mailto:` CTA: `leads` table, zod schema with
  every string bounded, honeypot answered with the success shape, direct
  email retained as a fallback path.

Verification: 172 tests, build and lint clean, no Google trademark hex or
stale slate chrome outside the three Google-UI mock components, zero WCAG AA
failures on the Ink and Cobalt grounds, no horizontal scroll at 1440 or 390.

**Outstanding — the gate decision:**
1. Does opening on Ink read as premium, or heavy for an SMB buyer?
2. Does the stand read as a real object, or as flat cardboard?
3. Is the page still fast, against the 1.52s deployed baseline?
Plus two flagged decisions: the warmed Paper value (`#fcfbf9`) and
Honey-on-Cobalt for the final CTA button.

**Outstanding — blocking the intake form:** migration
`supabase/migrations/0007_leads.sql` is written but **not yet applied** to the
live project. Until it is, the form validates correctly and then shows its
"email us instead" fallback error rather than writing a row.

## Parked launch backlog (blocked on materials/externals, not code)

- Stripe payment links → `pricing.tiers[].href` (currently mailto fallback).
- Real Google review URL → `site.reviewUrl` (enables the hero demo's real link).
- Email forwarding for hello@fivestarlocal.pro.
- "Meet the team" expansion (needs headshots — can ride with B3).
- Pizza-shop eval before any real customer uses ReplyDesk.
- GBP API application (docs/replydesk/GBP-API.md) → future auto-posting.
- First case-study numbers → `proof` block after first real install.

## Sequencing (historical — all planned work is complete)

```
Week 1:   Track 0 (one sitting) ──┬── A3 spec+build
                                  └── B1 brand kit → B2 card design (order cards)
Week 2+:  A4 ── then A5           └── B3 site alignment (after B1 approved)
Anytime:  parked backlog items as their external blockers clear
```

Executed as planned except B2 (skipped — pre-made cards). Track B never
shared a commit with Track A (marketing/admin separation is a binding
constraint).

## What's actually next

With all three tracks closed, the critical path is **no longer code** — it
is getting a first real business onto a card. In rough dependency order:

1. **Order the pre-made NFC cards** (the standing launch blocker; B2 was
   skipped precisely to unblock this).
2. **Real Google review URL** → `site.reviewUrl`. Cheap, and it makes the
   hero demo link to something real instead of a placeholder.
3. **Stripe payment links** → `pricing.tiers[].href`, replacing the mailto
   fallback. Required before anyone can actually pay.
4. **Pizza-shop eval** — run ReplyDesk end-to-end against a real business's
   reviews before a paying customer ever sees it. This also closes the
   unverified `SUPABASE_SERVICE_ROLE_KEY` / `OPENROUTER_API_KEY` question
   from Current state, since it exercises both.
5. Then, as they clear: email forwarding for hello@fivestarlocal.pro,
   headshots for the team section, the GBP API application, and the first
   case-study numbers.
