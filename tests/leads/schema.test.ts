import { describe, expect, it } from "vitest";
import { isBot, leadSchema } from "@/lib/leads/schema";

describe("leadSchema", () => {
  const valid = { businessName: "Bella's Bakery", email: "owner@bellas.com", note: "" };

  it("accepts a minimal valid submission and nulls an empty note", () => {
    const r = leadSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.note).toBeNull();
  });

  it("trims surrounding whitespace from the business name", () => {
    const r = leadSchema.safeParse({ ...valid, businessName: "  Bella's Bakery  " });
    expect(r.success && r.data.businessName).toBe("Bella's Bakery");
  });

  it("rejects a blank business name", () => {
    expect(leadSchema.safeParse({ ...valid, businessName: "   " }).success).toBe(false);
  });

  it("rejects a malformed email", () => {
    expect(leadSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects oversized input rather than writing it to the database", () => {
    expect(leadSchema.safeParse({ ...valid, businessName: "x".repeat(121) }).success).toBe(false);
    expect(leadSchema.safeParse({ ...valid, note: "x".repeat(501) }).success).toBe(false);
  });
});

describe("isBot", () => {
  it("treats an untouched honeypot as human", () => {
    expect(isBot("")).toBe(false);
    expect(isBot("   ")).toBe(false);
  });

  it("treats any filled honeypot as a bot", () => {
    expect(isBot("http://spam.example")).toBe(true);
  });
});
