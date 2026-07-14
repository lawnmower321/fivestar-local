import type OpenAI from "openai";
import { KB_MODEL, textOf } from "./client";
import { KB_SYSTEM_PROMPT, KB_FROM_URL_PROMPT, KB_FROM_TEXT_PROMPT } from "./prompts/kb";

export type KbSource = { kind: "url"; url: string } | { kind: "text"; raw: string };

// Cap on fetched-page text handed to the model — a homepage's visible copy
// fits comfortably; this just bounds token cost on unusually large pages.
const MAX_PAGE_CHARS = 20_000;

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// Below this much readable text we assume the fetch got a JS-rendered shell
// (SPA) rather than real page copy — better to fail loudly than silently
// distill an empty page into a hallucinated or blank KB.
const MIN_PAGE_CHARS = 200;

async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  const text = htmlToText(html).slice(0, MAX_PAGE_CHARS);
  if (text.length < MIN_PAGE_CHARS) {
    throw new Error(
      `Couldn't read enough text from ${url} (the site may render with JavaScript). Paste the business info as text instead.`,
    );
  }
  return text;
}

export async function buildKnowledgebase(
  openrouter: OpenAI,
  source: KbSource,
): Promise<string> {
  const userPrompt =
    source.kind === "url"
      ? KB_FROM_URL_PROMPT(source.url, await fetchPageText(source.url))
      : KB_FROM_TEXT_PROMPT(source.raw);

  const response = await openrouter.chat.completions.create({
    model: KB_MODEL,
    // KB_MODEL is a reasoning model (default effort "high") whose reasoning
    // tokens are billed against this budget. Sized to fit high-effort
    // reasoning PLUS the ~4k-token KB markdown, so the output is never
    // truncated by thinking. (To cut cost/latency you could instead disable
    // reasoning via OpenRouter's `reasoning:{enabled:false}` extension — see
    // DECISIONS.md; skipped here to stay within the OpenAI SDK's types.)
    max_tokens: 8000,
    messages: [
      { role: "system", content: KB_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const md = textOf(response).trim();
  if (!md) throw new Error("Knowledgebase generation returned no text");
  return md;
}
