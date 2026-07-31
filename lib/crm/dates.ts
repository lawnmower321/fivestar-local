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

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

// Formats a YYYY-MM-DD date-only string for display (e.g. "2026-08-04" ->
// "Aug 4, 2026"). Parses the string's own parts rather than going through
// `new Date(dueDate).toLocaleDateString()`: a bare YYYY-MM-DD parses as UTC
// midnight, and rendering that Date in any timezone behind UTC (including
// FOUNDER_TZ) shows the day before — exactly the shift this file exists to
// prevent for "today"/"overdue" math, so due dates must not reintroduce it.
export function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split("-").map(Number);
  return `${SHORT_MONTHS[month - 1]} ${day}, ${year}`;
}
