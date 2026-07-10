# ai/prompts — versioned prompt modules

Every LLM prompt in ReplyDesk lives here as an exported constant/builder, one
file per concern, with a header comment stating inputs and output contract.

INVARIANTS
- Prompt text changes are code changes: tested (tests/replydesk/prompts.test.ts),
  reviewed, and logged in docs/replydesk/DECISIONS.md when behavior-relevant.
- reply.ts rules must stay in sync with docs/replydesk/SPEC.md and with the
  code gates in ../../gates/ (the gates are the enforcement; the prompt is the
  first line of defense).
- Builders are pure string functions — no I/O.
