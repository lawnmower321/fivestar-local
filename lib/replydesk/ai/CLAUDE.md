# ai — OpenRouter callers

Wraps every LLM call in ReplyDesk. Prompts live in ./prompts (see its
CLAUDE.md); this folder owns request shape, parsing, and the gate/retry loop.

INVARIANTS
- One key (`OPENROUTER_API_KEY`), routed through the OpenAI-compatible
  `openai` SDK pointed at `https://openrouter.ai/api/v1` (client.ts). No
  vendor-specific SDK — model choice is just a slug string.
- Three models, one per task, each a deliberate choice logged in
  docs/replydesk/DECISIONS.md: `REPLY_MODEL` (openai/gpt-4.1-mini),
  `KB_MODEL` (deepseek/deepseek-v4-pro), `VOICE_MODEL` (google/gemini-2.5-pro).
- Reply generation uses `response_format: { type: "json_schema", ... }`;
  parse the text block with JSON.parse. generateReply retries up to 3 total
  attempts when gates fail, setting varyStructure on retries, then returns
  the flagged result.
- KB-from-URL fetches the page server-side with plain `fetch()` and strips it
  to text (build-knowledgebase.ts `fetchPageText`/`htmlToText`) — single page,
  no link-following. This replaced Anthropic's `web_fetch` server tool, which
  OpenRouter has no equivalent for; see DECISIONS.md for the tradeoff.
- The OpenRouter client is always INJECTED (first parameter) so tests use
  fakes. getOpenRouter() is only called from server actions.

TESTS: tests/replydesk/generate-reply.test.ts (fake client, no network)
