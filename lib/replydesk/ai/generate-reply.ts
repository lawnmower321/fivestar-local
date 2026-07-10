import type Anthropic from "@anthropic-ai/sdk";
import { MODEL, textOf } from "./client";
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
  anthropic: Anthropic,
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
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: REPLY_SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: REPLY_SCHEMA } },
      messages: [
        {
          role: "user",
          content: buildReplyUserPrompt({ ...input, varyStructure: attempt > 1 }),
        },
      ],
    });

    const parsed = JSON.parse(textOf(response)) as {
      reply: string;
      detail_referenced: string;
    };
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
