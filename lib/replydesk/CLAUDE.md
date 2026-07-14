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
- types.ts — shared types (Business, Review, GateReport, GeneratedReply)
- db.ts — Supabase factory + typed queries (service-role key, server-only)
- auth.ts — passcode hashing/verification for the /admin cookie
- kb-sections.ts — pure markdown-section merge/extract (founder-authored
  recovery section survives KB rebuilds)
- gates/ — reply quality gates (see gates/CLAUDE.md)
- ai/ — prompt builders + OpenRouter callers (see ai/CLAUDE.md)

TESTS: tests/replydesk/
