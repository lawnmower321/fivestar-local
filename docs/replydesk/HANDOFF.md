# ReplyDesk — Session Handoff

**Last updated:** 2026-07-13
**Branch:** `replydesk` (11 commits, `5c397c8..d7032fd`, off `master` @ `24accac`)
**Status:** Implementation COMPLETE. Not merged, not pushed. Awaiting integration decision.

---

## TL;DR for next session

All 10 tasks of `docs/superpowers/plans/2026-07-10-replydesk.md` are built, reviewed,
and committed via subagent-driven-development. A whole-branch review found 8 issues
(including one Critical auth hole); the user chose to fix **all 8**; the fix pass is
done and re-reviewed **"Ready to merge: Yes."** 31 tests pass, `tsc`/`build`/`lint`
clean.

**The one open decision:** how to integrate the branch. The
`finishing-a-development-branch` menu was presented but not yet answered:

1. Merge back to `master` locally
2. Push and create a Pull Request
3. Keep the branch as-is
4. Discard this work

Nothing has been merged, pushed, or discarded. Pick up here.

---

## What is DONE

### Feature
ReplyDesk: a passcode-protected `/admin` console where founders build a
per-customer knowledgebase (8 sections incl. founder-authored make-it-right
policy + signature language) and generate on-brand Google-review replies that
pass code-level anti-moderation quality gates.

| Task | What it delivered | Commits |
|------|-------------------|---------|
| 0 | Scaffolding, `.env.example`, deps | `24accac..5c397c8` |
| 1 | `lib/replydesk/types.ts`, `db.ts`, migration `0001_replydesk.sql` | `5c397c8..0ccbccb` |
| 2 | Quality gates (contact-info, similarity, length, index) | `0ccbccb..ef75708` |
| 3 | Versioned prompts (reply/kb/voice) | `ef75708..0652215` |
| 4 | `generate-reply.ts` gate/retry loop + Anthropic client | `0652215..7debdb6` |
| 5 | Auth (`auth.ts`), `(protected)/` route group, login page | `7debdb6..75f326d` |
| 6 | Business list page + 8 server actions | `75f326d..719e2a3` |
| 7 | Business detail page + reply-workspace placeholder | `719e2a3..6b1d41b` |
| 8 | Reply workspace UI (copy button gated on hardFail) | `6b1d41b..788d324` |
| 9 | Context-integrity pass (CLAUDE.md paths, DECISIONS sync) | `788d324..48aa97c` |

### Final review + fix pass
Whole-branch review (opus) surfaced 8 findings; user chose "fix everything":

1. **CRITICAL** — server actions were unauthenticated (`"use server"` exports are
   public POST endpoints; route-group layout only guards page *rendering*).
   Fixed: `app/admin/require-session.ts` `requireSession()` called at top of all 8 actions.
2. contact-info `URL_RE` missed `.shop`/`.app`/`.co.uk` → broadened + fixtures.
3. `copyAndMark` no try/catch + premature `setCopied` → wrapped, ordered correctly.
4. `generate-reply.ts` `JSON.parse` aborted retry loop → guarded per-attempt.
5. `reviewUrl` rendered into href without scheme validation → guarded.
6. draft rows accumulated in Recent-reviews → filtered to `status === "posted"`.
7. gates English-centric (intl phones, "DM us") → broadened.
8. hard-fail retry test asserted nothing → fixed test (behavior kept: still retries).

Fix commits: `48aa97c..d7032fd`. Re-review: **Ready to merge = Yes.**

### Verification (last run)
- `npm test` → **31 passed** (4 files: gates, prompts, generate-reply, auth)
- `tsc`, `next build`, lint → clean
- No network in tests (fake Anthropic client)

---

## What is LEFT — HUMAN tasks (cannot be automated)

These block real use but not the merge:

1. **Supabase** — create project, run `supabase/migrations/0001_replydesk.sql`,
   set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` AND Vercel.
2. **OpenRouter** — get API key + fund credits → `OPENROUTER_API_KEY`.
3. **Passcode** — choose a value → `REPLYDESK_PASSCODE`.
4. **GBP API** — submit the Google Business Profile API application per
   `docs/replydesk/GBP-API.md`.
5. **Eval** — run the pizza-shop eval before putting a real customer on it.

## Known non-blocking follow-up (documented, NOT fixed)
- Detail page: `listReviews(db, id, 50).filter(posted)` caps the fetch at 50 rows
  then filters in memory — a business with >50 drafts could show fewer posted rows.
  Audit trail + similarity gate unaffected.

---

## Important context / gotchas
- **Next.js 16 breaking changes** (see `AGENTS.md`): `cookies()`/`headers()`/route
  `params`/`searchParams` are **async** — await them. `x-invoke-path` header does
  **not** exist → auth is via the `(protected)/` route group, not middleware.
- **AI calls route through OpenRouter** (single `OPENROUTER_API_KEY`, no vendor
  SDK) via the `openai` package pointed at `https://openrouter.ai/api/v1`. Three
  models, one per task: `REPLY_MODEL` (openai/gpt-4.1-mini), `KB_MODEL`
  (deepseek/deepseek-v4-pro), `VOICE_MODEL` (google/gemini-2.5-pro) — see
  `lib/replydesk/ai/client.ts` and DECISIONS.md 2026-07-13. KB-from-URL no
  longer crawls the site; it fetches only the given page server-side.
- **Secrets stay server-side** — never `NEXT_PUBLIC_`, never commit `.env.local`.
- **Unrelated marketing changes** (`app/page.tsx`, `components/site/*`, `lib/content.ts`,
  `.gitignore`, two untracked `components/site/*` files) remain **uncommitted** in the
  working tree and were deliberately kept out of every ReplyDesk commit. Do NOT stage them.
- `lib/replydesk/` is pure/DI (no Next imports); `app/admin/` is the thin Next shell.
- Prompt says "40 words" while the gate enforces 45 — intentional soft/hard split.

## Where the durable record lives
- Progress ledger: `.superpowers/sdd/progress.md` (git-ignored scratch)
- Decision log: `docs/replydesk/DECISIONS.md`
- Plan: `docs/superpowers/plans/2026-07-10-replydesk.md`
