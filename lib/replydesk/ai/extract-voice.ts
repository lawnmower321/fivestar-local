import type OpenAI from "openai";
import { VOICE_MODEL, textOf } from "./client";
import { VOICE_SYSTEM_PROMPT, buildVoicePrompt } from "./prompts/voice";

export async function extractVoice(
  openrouter: OpenAI,
  pastReplies: string,
): Promise<string> {
  const response = await openrouter.chat.completions.create({
    model: VOICE_MODEL,
    // VOICE_MODEL (gemini-2.5-pro) has MANDATORY reasoning that cannot be
    // disabled, and its thinking tokens are billed against this budget. The
    // original 1500 (sized for non-thinking Opus) risked thinking exhausting
    // the budget before the profile was written, yielding empty content.
    // Raised to fit thinking + the voice-profile markdown.
    max_tokens: 4000,
    messages: [
      { role: "system", content: VOICE_SYSTEM_PROMPT },
      { role: "user", content: buildVoicePrompt(pastReplies) },
    ],
  });
  const md = textOf(response).trim();
  if (!md) throw new Error("Voice extraction returned no text");
  return md;
}
