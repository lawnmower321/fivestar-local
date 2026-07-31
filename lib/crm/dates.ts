// Due-date math in the founders' timezone (user decision 2026-07-31, spec
// 2026-07-31-phases-3-5-design.md): "today" flips at midnight ET, not UTC.
// Pure TS — no next/*.
export const FOUNDER_TZ = "America/New_York";

// en-CA locale formats as YYYY-MM-DD, matching the DATE column format.
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(now);
}

export function isOverdue(dueDate: string | null, today: string): boolean {
  return dueDate !== null && dueDate < today;
}

export function isDueToday(dueDate: string | null, today: string): boolean {
  return dueDate === today;
}
