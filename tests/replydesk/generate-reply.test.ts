import { describe, it, expect } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { generateReply } from "@/lib/replydesk/ai/generate-reply";

// Minimal fake of the Anthropic client: returns queued canned JSON replies.
function fakeClient(replies: Array<{ reply: string; detail_referenced: string }>) {
  let call = 0;
  const calls: unknown[] = [];
  const client = {
    messages: {
      create: async (params: unknown) => {
        calls.push(params);
        const body = replies[Math.min(call, replies.length - 1)];
        call++;
        return {
          stop_reason: "end_turn",
          content: [{ type: "text", text: JSON.stringify(body) }],
        };
      },
    },
  } as unknown as Anthropic;
  return { client, calls };
}

const input = {
  businessName: "Tony's Pizza",
  kbMd: "## Specialties\ngarlic knots",
  voiceMd: "warm",
  recentReplies: [] as string[],
  reviewText: "Garlic knots were incredible!",
  reviewer: "Maria",
  rating: 5,
};

describe("generateReply", () => {
  it("returns a passing reply on the first attempt", async () => {
    const { client } = fakeClient([
      { reply: "So glad the garlic knots hit the spot, Maria — see you soon!", detail_referenced: "garlic knots" },
    ]);
    const out = await generateReply(client, input);
    expect(out.gate.ok).toBe(true);
    expect(out.attempts).toBe(1);
    expect(out.detailReferenced).toBe("garlic knots");
  });

  it("retries when the reply is too similar to a recent one, with varyStructure set", async () => {
    const prev = "So glad the garlic knots hit the spot, Maria — see you soon!";
    const { client, calls } = fakeClient([
      { reply: prev, detail_referenced: "garlic knots" }, // attempt 1: near-duplicate
      { reply: "Maria, the kitchen crew is grinning — knots are our pride. Come back Friday!", detail_referenced: "garlic knots" },
    ]);
    const out = await generateReply(client, { ...input, recentReplies: [prev] });
    expect(out.attempts).toBe(2);
    expect(out.gate.ok).toBe(true);
    // second call's user prompt must include the vary-structure instruction
    const second = JSON.stringify(calls[1]);
    expect(second).toMatch(/completely different structure/i);
  });

  it("gives up after 3 attempts and returns the flagged reply", async () => {
    const prev = "So glad the garlic knots hit the spot, Maria — see you soon!";
    const { client } = fakeClient([{ reply: prev, detail_referenced: "garlic knots" }]);
    const out = await generateReply(client, { ...input, recentReplies: [prev] });
    expect(out.attempts).toBe(3);
    expect(out.gate.ok).toBe(false);
    expect(out.gate.hardFail).toBe(false);
  });

  it("hard-fails without retrying burn when contact info persists", async () => {
    const { client } = fakeClient([
      { reply: "Email tony@pizza.com and we'll fix it", detail_referenced: "issue" },
    ]);
    const out = await generateReply(client, input);
    expect(out.gate.hardFail).toBe(true);
    expect(out.gate.ok).toBe(false);
  });
});
