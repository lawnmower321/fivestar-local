# lib/replydesk — ReplyDesk core

Pure, dependency-injected business logic for ReplyDesk (see docs/replydesk/SPEC.md).

INVARIANTS
- Nothing in this tree imports from `next/*` or uses `use server`. Plain Node.
- External clients (OpenRouter, Supabase) are constructed in `client.ts`/`db.ts`
  factories and INJECTED into logic functions, so tests pass fakes.
- One provider key (`OPENROUTER_API_KEY`), one model per task — see ai/CLAUDE.md.
- Quality gates (gates/) run in code AFTER generation. AI output is never
  trusted to self-certify.

MAP
- types.ts — shared types (Business — incl. CRM status/contact fields typed via lib/crm/status —, Review, GateReport, GeneratedReply, ReviewMeta — a projection of reviews used by lib/crm/attention.buildAttention; lives here because reviews are ReplyDesk domain, imported type-only by lib/crm/attention.ts)
- db.ts — Supabase factory + typed queries (service-role key, server-only). getBusiness throws on a missing row; findBusiness returns null instead, so route code can map null → notFound() (lib stays next-free — the route layer owns notFound()). recentPostedAcrossClients(db, limit=20) (missing joined business maps to null, not "", matching lib/crm/db's convention) and listReviewMeta(db, businessIds) (ordered created_at desc, capped at REVIEW_META_ROW_CAP=1000 — the entire result feeds buildAttention, so ordering newest-first keeps the cap non-arbitrary against reviews' unbounded audit-trail growth) back the cross-client Reply queue dashboard (listReviewMeta returns [] without querying on an empty id list). Both recentPostedAcrossClients and recentPostedReplies order posted_at desc with nullsFirst:false (Postgres defaults DESC to nulls-first, which would otherwise surface a null-postedAt row before real dates). updateBusiness's patch deliberately has no `status` field — status changes go through getPendingStatusChange/setStatusWithPending/clearPendingStatusChange instead (see DECISIONS.md), which persist the outstanding {from,to} transition atomically with the status write so a subsequent activity-write failure can self-heal on the next call instead of silently losing the transition.
- kb-sections.ts — pure markdown-section merge/extract (founder-authored
  recovery section survives KB rebuilds)
- gates/ — reply quality gates (see gates/CLAUDE.md)
- ai/ — prompt builders + OpenRouter callers (see ai/CLAUDE.md)

TESTS: tests/replydesk/
