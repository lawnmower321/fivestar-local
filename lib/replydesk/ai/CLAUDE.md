# ai — Anthropic callers

Wraps every Claude API call in ReplyDesk. Prompts live in ./prompts (see its
CLAUDE.md); this folder owns request shape, parsing, and the gate/retry loop.

INVARIANTS
- Model: claude-opus-4-8 (constant MODEL in client.ts). Never send temperature/
  top_p/top_k/budget_tokens — they 400 on this model family.
- Reply generation uses output_config json_schema; parse the text block with
  JSON.parse. generateReply retries up to 3 total attempts when gates fail,
  setting varyStructure on retries, then returns the flagged result.
- KB-from-URL uses the web_fetch_20260209 server tool (max_uses 5) and handles
  stop_reason "pause_turn" by echoing the assistant turn (max 5 continuations).
- The Anthropic client is always INJECTED (first parameter) so tests use fakes.
  getAnthropic() is only called from server actions.

TESTS: tests/replydesk/generate-reply.test.ts (fake client, no network)
