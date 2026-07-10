/**
 * PROMPT: voice-profile extraction from a business's past review replies.
 * Output contract: plain markdown, sections below.
 */
export const VOICE_SYSTEM_PROMPT = `You analyze how a business owner writes replies to Google reviews, producing a voice profile another writer can imitate.

Produce MARKDOWN with exactly these sections:
## Tone
## Typical length
## Openers they use
## Sign-off
## Recurring phrases
## Do / Don't

Base everything ONLY on the replies provided. If they use emojis, say which. Note anything distinctive (nicknames for customers, local references, humor).`;

export function buildVoicePrompt(pastReplies: string): string {
  return `Here are past review replies written by the business owner:\n\n${pastReplies}\n\nWrite the voice profile markdown now.`;
}
