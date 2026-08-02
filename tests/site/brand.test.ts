import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";

describe("BRAND", () => {
  it("exposes every ground and ink token as a hex string", () => {
    for (const key of ["ink", "cobalt", "honey", "paper", "mist", "slate", "hairline"] as const) {
      expect(BRAND[key]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("uses the owned Cobalt & Honey values, not Google's trademark hexes", () => {
    expect(BRAND.cobalt).toBe("#2749d6");
    expect(BRAND.honey).toBe("#e8a317");
    expect(BRAND.ink).toBe("#0f1b3d");
  });

  it("keeps Paper warmer than pure white so it never reads as screen-white", () => {
    expect(BRAND.paper).not.toBe("#ffffff");
    const r = parseInt(BRAND.paper.slice(1, 3), 16);
    const b = parseInt(BRAND.paper.slice(5, 7), 16);
    expect(r).toBeGreaterThan(b); // warm = more red than blue
  });
});
