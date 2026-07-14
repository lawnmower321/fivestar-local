import { describe, it, expect } from "vitest";
import {
  loginSchema, createBusinessSchema, generateReplySchema,
  markPostedSchema, buildKbFromUrlSchema, buildKbFromTextSchema,
} from "@/app/admin/schemas";

const UUID = "a2f7c1de-3b44-4e6f-9a10-8a2f1c3d4e5f";

describe("loginSchema", () => {
  it("accepts a valid email + password", () => {
    expect(loginSchema.parse({ email: "a@b.com", password: "x" }))
      .toEqual({ email: "a@b.com", password: "x" });
  });
  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });
  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("createBusinessSchema", () => {
  it("trims the name", () => {
    expect(createBusinessSchema.parse({ name: "  Tony's  ", reviewUrl: "" }).name).toBe("Tony's");
  });
  it("rejects an empty name", () => {
    expect(createBusinessSchema.safeParse({ name: "   ", reviewUrl: "" }).success).toBe(false);
  });
  it("keeps an http(s) review URL", () => {
    expect(createBusinessSchema.parse({ name: "T", reviewUrl: "https://g.page/x" }).reviewUrl)
      .toBe("https://g.page/x");
  });
  it("nulls a non-http review URL (javascript:)", () => {
    expect(createBusinessSchema.parse({ name: "T", reviewUrl: "javascript:alert(1)" }).reviewUrl)
      .toBeNull();
  });
});

describe("generateReplySchema", () => {
  const base = { businessId: UUID, rating: 5, reviewer: "", reviewText: "Great!" };
  it("accepts a valid input", () => {
    expect(generateReplySchema.parse(base).rating).toBe(5);
  });
  it("rejects rating 0", () => {
    expect(generateReplySchema.safeParse({ ...base, rating: 0 }).success).toBe(false);
  });
  it("rejects a fractional rating", () => {
    expect(generateReplySchema.safeParse({ ...base, rating: 4.5 }).success).toBe(false);
  });
  it("rejects empty review text", () => {
    expect(generateReplySchema.safeParse({ ...base, reviewText: "  " }).success).toBe(false);
  });
});

describe("id schemas", () => {
  it("markPostedSchema rejects a non-uuid", () => {
    expect(markPostedSchema.safeParse({ reviewId: "nope", businessId: UUID }).success).toBe(false);
  });
  it("buildKbFromUrlSchema rejects a javascript: url", () => {
    expect(buildKbFromUrlSchema.safeParse({ businessId: UUID, url: "javascript:x" }).success).toBe(false);
  });
  it("buildKbFromTextSchema rejects whitespace-only text", () => {
    expect(buildKbFromTextSchema.safeParse({ businessId: UUID, raw: "   " }).success).toBe(false);
  });
});
