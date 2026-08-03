import { describe, expect, it } from "vitest";
import { odometerValue } from "@/lib/odometer";

describe("odometerValue", () => {
  it("returns the start value at zero progress", () => {
    expect(odometerValue(18, 212, 0)).toBe("18");
  });

  it("returns the end value at full progress", () => {
    expect(odometerValue(18, 212, 1)).toBe("212");
  });

  it("interpolates linearly at the midpoint", () => {
    expect(odometerValue(0, 100, 0.5)).toBe("50");
  });

  it("formats ratings to one decimal", () => {
    expect(odometerValue(3.9, 4.9, 0, 1)).toBe("3.9");
    expect(odometerValue(3.9, 4.9, 1, 1)).toBe("4.9");
  });

  it("clamps progress outside 0..1 rather than overshooting", () => {
    // Motion's useScroll can report slightly out-of-range values at the
    // extremes; an unclamped odometer would briefly show 4.97 stars.
    expect(odometerValue(3.9, 4.9, 1.4, 1)).toBe("4.9");
    expect(odometerValue(3.9, 4.9, -0.3, 1)).toBe("3.9");
  });

  it("rounds rather than truncates", () => {
    expect(odometerValue(0, 10, 0.19)).toBe("2");
  });
});
