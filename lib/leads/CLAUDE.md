# lib/leads — public marketing-site intake

Pure, dependency-injected. Sibling of lib/crm and lib/replydesk, same rules.

INVARIANTS
- Nothing here imports from `next/*` or constructs a Supabase client.
- This is the ONLY input path on the product reachable without auth. Every
  string field is length-bounded in schema.ts; do not relax a bound without
  a matching reason, and never add a field that is written unbounded.
- The honeypot lives in `isBot`, deliberately outside `leadSchema`, so a bot
  can be answered with the same success shape a human gets. Folding it into
  the schema would leak the trap through a validation error.

MAP
- schema.ts — leadSchema (zod), MAX_NAME/MAX_EMAIL/MAX_NOTE, isBot,
  LeadInput, LeadResult.
- db.ts — insertLead(db, lead), injected SupabaseClient.

TESTS: tests/leads/
