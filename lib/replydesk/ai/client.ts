import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-4-8";

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic(); // reads ANTHROPIC_API_KEY from env
}

/** Concatenate all text blocks of a response. */
export function textOf(response: { content: Array<{ type: string; text?: string }> }): string {
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
}
