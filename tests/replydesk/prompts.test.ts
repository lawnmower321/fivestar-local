import { describe, it, expect } from "vitest";
import { REPLY_SYSTEM_PROMPT, buildReplyUserPrompt } from "@/lib/replydesk/ai/prompts/reply";
import { KB_SYSTEM_PROMPT } from "@/lib/replydesk/ai/prompts/kb";

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

  it("caps signature language at one phrase", () => {
    expect(REPLY_SYSTEM_PROMPT).toMatch(/Signature Language/);
    expect(REPLY_SYSTEM_PROMPT).toMatch(/AT MOST ONE/);
    expect(REPLY_SYSTEM_PROMPT).toMatch(/reads like marketing copy is a failed reply/i);
  });

  it("directs negative replies to the real recovery action", () => {
    expect(REPLY_SYSTEM_PROMPT).toMatch(/"When Something Goes Wrong"/);
    expect(REPLY_SYSTEM_PROMPT).toMatch(/never as contact info/i);
  });
});

describe("kb prompt", () => {
  it("names every model-produced section", () => {
    for (const heading of [
      "## Overview",
      "## Services & Products",
      "## Signature Language",
      "## Hours & Location",
      "## People",
      "## Specialties & Crowd Favorites",
      "## Facts a reply might reference",
    ]) {
      expect(KB_SYSTEM_PROMPT).toContain(heading);
    }
  });

  it("forbids the model from writing the recovery section", () => {
    expect(KB_SYSTEM_PROMPT).toMatch(/NEVER write a "When Something Goes Wrong" section/);
  });

  it("keeps the never-invent rule", () => {
    expect(KB_SYSTEM_PROMPT).toMatch(/NEVER invent/);
  });

  it("asks for neighborhood identity and natural phrases", () => {
    expect(KB_SYSTEM_PROMPT).toMatch(/neighborhood/i);
    expect(KB_SYSTEM_PROMPT).toMatch(/sound like speech, not marketing copy/i);
  });
});
