# gates — reply quality gates

Pure functions that police generated replies AFTER the model returns. The model
is never trusted to self-certify; these run in code.

INVARIANTS
- contact-info is a HARD fail (hardFail: true) — the UI must never show a
  copy-ready reply that trips it.
- similarity > SIMILARITY_THRESHOLD (0.6) and negative-review length are SOFT
  fails — generation retries (max 2), then flags for the human.
- No I/O, no imports from ai/ or db.ts. Changing a threshold or regex requires
  a DECISIONS.md entry.

TESTS: tests/replydesk/gates.test.ts
