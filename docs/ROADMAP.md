# FiveStar Local — Roadmap (approved 2026-07-27)

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

## Current state (all verified 2026-07-27)

- `master` = `c55855d`, in sync with `origin/master` (git).
- Vercel production is READY at `c55855d` — deployments are caught up
  (Vercel API). Project `project-wkd8v`, team `team_U6oSzJ8quCdf2rm5o83rAvun`.
- The 2026-07-26 deploy initially failed because `SUPABASE_URL` /
  `SUPABASE_PUBLISHABLE_KEY` are **not set on Vercel**; commit `c55855d`
  works around it with `force-dynamic` on `/admin` — the deployed `/admin`
  will still fail at request time until env vars are added (Vercel API,
  commit message).
- Supabase project is live: `businesses`, `reviews`, `profiles` exist with
  RLS enabled; remote migration history tracks `profiles` (0002) and
  `client_fields` (0003); 0001 was pasted manually, as the spec records
  (Supabase MCP).
- `profiles` has **0 rows** — the two founder accounts and their profile
  rows were never seeded (Supabase MCP). Phase 3 attribution depends on this.
- Working tree: small uncommitted tweaks to `components/site/review-showcase.tsx`,
  `scan-showcase.tsx`, `tap-demo.tsx`; untracked `.claude/`, `.mcp.json`,
  `scripts/`, `skills-lock.json` (git status).

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

## Track 0 — Production readiness & hygiene tail (do first, ~1 session)

*Execution: any model; mostly dashboard work.*

**0.1 Vercel env vars.** Add to the Vercel project (production +
preview): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY` — values from
`.env.local` / provider dashboards, referenced only as `${ENV_VAR}` (never
pasted into chat or commits).
**Done when:** the deployed `/admin/login` renders and a login attempt
reaches Supabase (wrong-password error is success; a 500 is not).

**0.2 Seed founder accounts.** In Supabase dashboard: confirm self-signup
disabled; create the two founder auth users; insert their `profiles` rows
(`id` = auth user id, `display_name`). No signup trigger — manual is the
approved pattern.
**Done when:** `profiles` has 2 rows and both founders can log in on the
deployed `/admin`.

**0.3 Hygiene tail.** Commit the three `components/site/*` tweaks as one
marketing commit; add `.claude/`, `.mcp.json`, `skills-lock.json` to
`.gitignore` (per assumption 1; check `scripts/` contents — commit if it's
project code, ignore if scratch).
**Done when:** `git status` is clean.

## Track A — CRM evolution (Phases 3 → 4 → 5, in order)

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

## Track B — Brand & design (parallel to Track A, no code dependency)

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

## Parked launch backlog (blocked on materials/externals, not code)

- Stripe payment links → `pricing.tiers[].href` (currently mailto fallback).
- Real Google review URL → `site.reviewUrl` (enables the hero demo's real link).
- Email forwarding for hello@fivestarlocal.pro.
- "Meet the team" expansion (needs headshots — can ride with B3).
- Pizza-shop eval before any real customer uses ReplyDesk.
- GBP API application (docs/replydesk/GBP-API.md) → future auto-posting.
- First case-study numbers → `proof` block after first real install.

## Sequencing

```
Week 1:   Track 0 (one sitting) ──┬── A3 spec+build
                                  └── B1 brand kit → B2 card design (order cards)
Week 2+:  A4 ── then A5           └── B3 site alignment (after B1 approved)
Anytime:  parked backlog items as their external blockers clear
```

Track B never shares a commit with Track A (marketing/admin separation is a
binding constraint). A5 may start any time after A3 but reads best after A4.
