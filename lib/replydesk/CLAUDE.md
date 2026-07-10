# lib/replydesk — ReplyDesk core

Pure, dependency-injected business logic for ReplyDesk (see docs/replydesk/SPEC.md).

INVARIANTS
- Nothing in this tree imports from `next/*` or uses `use server`. Plain Node.
- External clients (Anthropic, Supabase) are constructed in `client.ts`/`db.ts`
  factories and INJECTED into logic functions, so tests pass fakes.
- Model is exactly `claude-opus-4-8`; no temperature/top_p/top_k/budget_tokens.
- Quality gates (gates/) run in code AFTER generation. AI output is never
  trusted to self-certify.

MAP
- types.ts — shared types (Business, Review, GateReport, GeneratedReply)
- db.ts — Supabase factory + typed queries (service-role key, server-only)
- auth.ts — passcode hashing/verification for the /admin cookie
- gates/ — reply quality gates (see gates/CLAUDE.md)
- ai/ — prompt builders + Anthropic callers (see ai/CLAUDE.md)

TESTS: tests/replydesk/
