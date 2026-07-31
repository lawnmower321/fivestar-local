import { describe, it, expect } from "vitest";
import { FOUNDER_TZ, todayInTimeZone, isOverdue, isDueToday, formatDueDate } from "@/lib/crm/dates";

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

describe("formatDueDate", () => {
  it("formats a YYYY-MM-DD string as a readable date", () => {
    expect(formatDueDate("2026-08-04")).toBe("Aug 4, 2026");
    expect(formatDueDate("2026-01-01")).toBe("Jan 1, 2026");
  });

  it("does not shift the date the way new Date(str) parsing would (regression guard)", () => {
    // new Date("2026-08-04") parses the bare date as UTC midnight. Rendering
    // that Date in any timezone behind UTC (America/New_York included)
    // shows the day before. This first assertion proves the trap is real,
    // independent of the host machine's own timezone; the second proves
    // formatDueDate — which parses the string's own parts — does not fall
    // into it.
    const viaUtcMidnightDate = new Intl.DateTimeFormat("en-US", {
      timeZone: FOUNDER_TZ, month: "short", day: "numeric", year: "numeric",
    }).format(new Date("2026-08-04"));
    expect(viaUtcMidnightDate).toBe("Aug 3, 2026");
    expect(formatDueDate("2026-08-04")).toBe("Aug 4, 2026");
  });
});
