import { describe, it, expect } from "vitest";
import type OpenAI from "openai";
import { generateReply } from "@/lib/replydesk/ai/generate-reply";

// Minimal fake of the OpenAI (OpenRouter) client: returns queued canned JSON replies.
function fakeClient(replies: Array<{ reply: string; detail_referenced: string }>) {
  let call = 0;
  const calls: unknown[] = [];
  const client = {
    chat: {
      completions: {
        create: async (params: unknown) => {
          calls.push(params);
          const body = replies[Math.min(call, replies.length - 1)];
          call++;
          return {
            choices: [{ message: { content: JSON.stringify(body) } }],
          };
        },
      },
    },
  } as unknown as OpenAI;
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

  it("exhausts all 3 attempts on a persistent hard-fail (retrying is intentional)", async () => {
    // Hard-fails (contact info) are retried the full MAX_ATTEMPTS on purpose:
    // a regeneration is another shot at a postable reply, and the cost is a few
    // cents only in the rare hard-fail case. See docs/replydesk/DECISIONS.md.
    const { client } = fakeClient([
      { reply: "Email tony@pizza.com and we'll fix it", detail_referenced: "issue" },
    ]);
    const out = await generateReply(client, input);
    expect(out.attempts).toBe(3);
    expect(out.gate.hardFail).toBe(true);
    expect(out.gate.ok).toBe(false);
  });

  it("does not throw on malformed (non-JSON) model output and returns a flagged result", async () => {
    // Fake client that returns plain text instead of the expected JSON schema.
    const client = {
      chat: {
        completions: {
          create: async () => ({
            choices: [{ message: { content: "Sorry, I can't help with that." } }],
          }),
        },
      },
    } as unknown as OpenAI;
    const out = await generateReply(client, input);
    expect(out.gate.ok).toBe(false);
    expect(out.attempts).toBe(3);
    expect(out.gate.reasons).toContain("model returned malformed output");
  });
});
