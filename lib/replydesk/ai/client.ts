import OpenAI from "openai";

// Every ReplyDesk AI call routes through OpenRouter on one key
// (OPENROUTER_API_KEY) instead of a per-vendor key. Each task picks the
// model best suited to it — see docs/replydesk/DECISIONS.md.
export const REPLY_MODEL = "openai/gpt-4.1-mini";
export const KB_MODEL = "deepseek/deepseek-v4-pro";
export const VOICE_MODEL = "google/gemini-2.5-pro";

export function getOpenRouter(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");
  return new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey });
}

/** Extract the text of a chat-completion response. */
export function textOf(response: {
  choices: Array<{ message: { content?: string | null } }>;
}): string {
  return response.choices[0]?.message?.content ?? "";
}
