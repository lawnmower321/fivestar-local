import type OpenAI from "openai";
import { REPLY_MODEL, textOf } from "./client";
import { REPLY_SYSTEM_PROMPT, buildReplyUserPrompt } from "./prompts/reply";
import { runGates } from "../gates";
import type { GeneratedReply } from "../types";

const REPLY_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    detail_referenced: { type: "string" },
  },
  required: ["reply", "detail_referenced"],
  additionalProperties: false,
} as const;

const MAX_ATTEMPTS = 3;

export async function generateReply(
  openrouter: OpenAI,
  input: {
    businessName: string;
    kbMd: string;
    voiceMd: string;
    recentReplies: string[];
    reviewText: string;
    reviewer: string | null;
    rating: number;
  },
): Promise<GeneratedReply> {
  let last: GeneratedReply | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await openrouter.chat.completions.create({
      model: REPLY_MODEL,
      max_tokens: 1000,
      response_format: {
        type: "json_schema",
        json_schema: { name: "reply", strict: true, schema: REPLY_SCHEMA },
      },
      messages: [
        { role: "system", content: REPLY_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildReplyUserPrompt({ ...input, varyStructure: attempt > 1 }),
        },
      ],
    });

    const raw = textOf(response);
    let parsed: { reply: string; detail_referenced: string } | null = null;
    try {
      parsed = JSON.parse(raw) as { reply: string; detail_referenced: string };
    } catch {
      // A non-JSON attempt is a FAILED attempt, not a fatal error: record a
      // flagged result and let the loop try again. After MAX_ATTEMPTS this
      // returns a flagged GeneratedReply for human review instead of throwing.
      last = {
        reply: raw,
        detailReferenced: "",
        gate: {
          ok: false,
          hardFail: false,
          reasons: ["model returned malformed output"],
          similarity: 0,
        },
        attempts: attempt,
      };
      continue;
    }
    const gate = runGates(parsed.reply, {
      rating: input.rating,
      recentReplies: input.recentReplies,
    });
    last = {
      reply: parsed.reply,
      detailReferenced: parsed.detail_referenced,
      gate,
      attempts: attempt,
    };
    if (gate.ok) return last;
    // Retry on any failure (retrying can also clear contact-info misses);
    // after MAX_ATTEMPTS we return the flagged result for human review.
  }

  return last!;
}
