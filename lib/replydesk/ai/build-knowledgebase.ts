import type Anthropic from "@anthropic-ai/sdk";
import { MODEL, textOf } from "./client";
import { KB_SYSTEM_PROMPT, KB_FROM_URL_PROMPT, KB_FROM_TEXT_PROMPT } from "./prompts/kb";

export type KbSource = { kind: "url"; url: string } | { kind: "text"; raw: string };

export async function buildKnowledgebase(
  anthropic: Anthropic,
  source: KbSource,
): Promise<string> {
  const userPrompt =
    source.kind === "url" ? KB_FROM_URL_PROMPT(source.url) : KB_FROM_TEXT_PROMPT(source.raw);

  const params = {
    model: MODEL,
    max_tokens: 4000,
    system: KB_SYSTEM_PROMPT,
    messages: [{ role: "user" as const, content: userPrompt }],
    // web_fetch only fetches URLs already present in the conversation —
    // the URL is in the user prompt, so the homepage fetch is allowed, and
    // same-site links found in fetched pages become fetchable in turn.
    ...(source.kind === "url"
      ? { tools: [{ type: "web_fetch_20260209" as const, name: "web_fetch" as const, max_uses: 5 }] }
      : {}),
  };

  let response = await anthropic.messages.create(params);
  // Server-side tools can pause the turn; resume by echoing the assistant turn.
  let continuations = 0;
  while (response.stop_reason === "pause_turn" && continuations < 5) {
    response = await anthropic.messages.create({
      ...params,
      messages: [
        { role: "user" as const, content: userPrompt },
        { role: "assistant" as const, content: response.content },
      ],
    });
    continuations++;
  }

  const md = textOf(response).trim();
  if (!md) throw new Error("Knowledgebase generation returned no text");
  return md;
}
