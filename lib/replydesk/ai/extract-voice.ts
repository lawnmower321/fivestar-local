import type Anthropic from "@anthropic-ai/sdk";
import { MODEL, textOf } from "./client";
import { VOICE_SYSTEM_PROMPT, buildVoicePrompt } from "./prompts/voice";

export async function extractVoice(
  anthropic: Anthropic,
  pastReplies: string,
): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: VOICE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildVoicePrompt(pastReplies) }],
  });
  const md = textOf(response).trim();
  if (!md) throw new Error("Voice extraction returned no text");
  return md;
}
