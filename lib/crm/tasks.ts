import type { Task } from "./types";
import { isDueToday, isOverdue } from "./dates";

export type TaskBuckets<T extends Task> = {
  overdue: T[]; today: T[]; upcoming: T[]; anytime: T[]; done: T[];
};

// One bucketing rule for all three task surfaces (client tab, /admin/tasks,
// dashboard). ISO YYYY-MM-DD strings compare correctly as strings.
export function bucketTasks<T extends Task>(tasks: T[], today: string): TaskBuckets<T> {
  const b: TaskBuckets<T> = { overdue: [], today: [], upcoming: [], anytime: [], done: [] };
  for (const t of tasks) {
    if (t.status === "done") b.done.push(t);
    else if (isOverdue(t.dueDate, today)) b.overdue.push(t);
    else if (isDueToday(t.dueDate, today)) b.today.push(t);
    else if (t.dueDate) b.upcoming.push(t);
    else b.anytime.push(t);
  }
  const byDue = (a: T, z: T) => (a.dueDate! < z.dueDate! ? -1 : a.dueDate! > z.dueDate! ? 1 : 0);
  b.overdue.sort(byDue);
  b.upcoming.sort(byDue);
  return b;
}
