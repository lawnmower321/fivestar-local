import { describe, it, expect } from "vitest";
import { REPLY_SYSTEM_PROMPT, buildReplyUserPrompt } from "@/lib/replydesk/ai/prompts/reply";

const baseInput = {
  businessName: "Tony's Pizza",
  kbMd: "## Services\nWood-fired pizza, garlic knots",
  voiceMd: "Warm, first-person, signs off with -Tony",
  recentReplies: ["Earlier reply one.", "Earlier reply two."],
  reviewText: "The garlic knots were incredible!",
  reviewer: "Maria",
  rating: 5,
  varyStructure: false,
};

describe("reply prompts", () => {
  it("system prompt bakes in the non-negotiable rules", () => {
    expect(REPLY_SYSTEM_PROMPT).toMatch(/never include emails/i);
    expect(REPLY_SYSTEM_PROMPT).toMatch(/one specific detail/i);
    expect(REPLY_SYSTEM_PROMPT).toMatch(/40 words/);
  });
  it("user prompt contains KB, voice, review, rating, and recent replies", () => {
    const p = buildReplyUserPrompt(baseInput);
    expect(p).toContain("garlic knots");
    expect(p).toContain("-Tony");
    expect(p).toContain("Maria");
    expect(p).toContain("5 stars");
    expect(p).toContain("Earlier reply two.");
  });
  it("adds the vary-structure instruction only on retries", () => {
    expect(buildReplyUserPrompt(baseInput)).not.toMatch(/completely different structure/i);
    expect(buildReplyUserPrompt({ ...baseInput, varyStructure: true }))
      .toMatch(/completely different structure/i);
  });
});
