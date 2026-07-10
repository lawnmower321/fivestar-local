import { describe, it, expect } from "vitest";
import { findContactInfo } from "@/lib/replydesk/gates/contact-info";
import { diceSimilarity, maxSimilarity } from "@/lib/replydesk/gates/similarity";
import { lengthViolation } from "@/lib/replydesk/gates/length";
import { runGates, SIMILARITY_THRESHOLD } from "@/lib/replydesk/gates";

describe("contact-info gate", () => {
  it("flags emails", () => {
    expect(findContactInfo("Reach me at tony@tonyspizza.com anytime")).toContain("email");
  });
  it("flags phone numbers in common formats", () => {
    expect(findContactInfo("Call (555) 123-4567 and ask for Tony")).toContain("phone");
    expect(findContactInfo("Call 555-123-4567")).toContain("phone");
    expect(findContactInfo("Call 5551234567 today")).toContain("phone");
  });
  it("flags URLs", () => {
    expect(findContactInfo("See www.tonyspizza.com for deals")).toContain("URL");
    expect(findContactInfo("Visit https://tonyspizza.com")).toContain("URL");
  });
  it("flags contact phrases", () => {
    expect(findContactInfo("Please contact us at the shop")).toContain("contact phrase");
  });
  it("passes clean replies mentioning numbers that are not phones", () => {
    expect(findContactInfo("Thanks for visiting us on May 5, 2026 — the garlic knots are a team favorite!")).toBeNull();
    expect(findContactInfo("Glad the party of 12 had a great time!")).toBeNull();
  });
});

describe("similarity gate", () => {
  it("returns 1 for identical strings", () => {
    expect(diceSimilarity("thanks so much", "thanks so much")).toBeCloseTo(1, 5);
  });
  it("returns near 0 for unrelated strings", () => {
    expect(diceSimilarity("the pepperoni was amazing", "we fixed your brake pads")).toBeLessThan(0.3);
  });
  it("maxSimilarity picks the highest match in the corpus", () => {
    const corpus = ["totally different text", "thanks so much for the kind words"];
    expect(maxSimilarity("thanks so much for the kind words!", corpus)).toBeGreaterThan(0.8);
  });
  it("returns 0 for an empty corpus", () => {
    expect(maxSimilarity("anything", [])).toBe(0);
  });
});

describe("length gate", () => {
  const long = Array(50).fill("word").join(" ");
  it("flags long replies to negative reviews", () => {
    expect(lengthViolation(long, 2)).toContain("45 words");
  });
  it("allows long replies to positive reviews", () => {
    expect(lengthViolation(long, 5)).toBeNull();
  });
  it("allows short replies to negative reviews", () => {
    expect(lengthViolation("So sorry about the wait — please give us another chance.", 1)).toBeNull();
  });
});

describe("runGates", () => {
  it("hard-fails on contact info", () => {
    const r = runGates("Email tony@pizza.com", { rating: 5, recentReplies: [] });
    expect(r.ok).toBe(false);
    expect(r.hardFail).toBe(true);
  });
  it("soft-fails on high similarity", () => {
    const prev = "Thanks so much for the kind words about our garlic knots!";
    const r = runGates(prev, { rating: 5, recentReplies: [prev] });
    expect(r.ok).toBe(false);
    expect(r.hardFail).toBe(false);
    expect(r.similarity).toBeGreaterThan(SIMILARITY_THRESHOLD);
  });
  it("passes a clean, novel reply", () => {
    const r = runGates("The garlic knots crew says thank you — see you Friday!", {
      rating: 5,
      recentReplies: ["Completely unrelated earlier reply about brake pads."],
    });
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });
});
