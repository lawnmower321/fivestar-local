import { describe, it, expect } from "vitest";
import { FOUNDER_TZ, todayInTimeZone, isOverdue, isDueToday } from "@/lib/crm/dates";

describe("todayInTimeZone", () => {
  it("returns the ET calendar date, not the UTC one, late in the ET evening", () => {
    // 2026-08-01T01:30Z is still 2026-07-31 21:30 in New York (EDT = UTC-4)
    const lateEvening = new Date("2026-08-01T01:30:00Z");
    expect(todayInTimeZone(FOUNDER_TZ, lateEvening)).toBe("2026-07-31");
    expect(todayInTimeZone("UTC", lateEvening)).toBe("2026-08-01");
  });
  it("formats as YYYY-MM-DD", () => {
    expect(todayInTimeZone(FOUNDER_TZ, new Date("2026-07-15T12:00:00Z"))).toBe("2026-07-15");
  });
});

describe("isOverdue / isDueToday", () => {
  const today = "2026-07-31";
  it("classifies dates against today", () => {
    expect(isOverdue("2026-07-30", today)).toBe(true);
    expect(isOverdue("2026-07-31", today)).toBe(false);
    expect(isOverdue("2026-08-01", today)).toBe(false);
    expect(isDueToday("2026-07-31", today)).toBe(true);
    expect(isDueToday("2026-07-30", today)).toBe(false);
  });
  it("null due date is never overdue or due today", () => {
    expect(isOverdue(null, today)).toBe(false);
    expect(isDueToday(null, today)).toBe(false);
  });
});
