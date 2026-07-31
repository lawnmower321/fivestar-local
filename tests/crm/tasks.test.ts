import { describe, it, expect } from "vitest";
import { bucketTasks } from "@/lib/crm/tasks";
import type { Task } from "@/lib/crm/types";

function task(partial: Partial<Task>): Task {
  return {
    id: "t1", businessId: null, assignee: null, title: "x", dueDate: null,
    status: "open", createdBy: null, createdAt: "2026-07-31T12:00:00Z",
    completedAt: null, ...partial,
  };
}

describe("bucketTasks", () => {
  const today = "2026-07-31";
  it("splits open tasks into overdue/today/upcoming/anytime and done aside", () => {
    const tasks = [
      task({ id: "a", dueDate: "2026-07-29" }),
      task({ id: "b", dueDate: "2026-07-31" }),
      task({ id: "c", dueDate: "2026-08-04" }),
      task({ id: "d", dueDate: null }),
      task({ id: "e", dueDate: "2026-07-01", status: "done", completedAt: "2026-07-02T00:00:00Z" }),
    ];
    const b = bucketTasks(tasks, today);
    expect(b.overdue.map((t) => t.id)).toEqual(["a"]);
    expect(b.today.map((t) => t.id)).toEqual(["b"]);
    expect(b.upcoming.map((t) => t.id)).toEqual(["c"]);
    expect(b.anytime.map((t) => t.id)).toEqual(["d"]);
    expect(b.done.map((t) => t.id)).toEqual(["e"]);
  });
  it("sorts overdue and upcoming by due date ascending", () => {
    const b = bucketTasks([
      task({ id: "late2", dueDate: "2026-07-30" }),
      task({ id: "late1", dueDate: "2026-07-20" }),
      task({ id: "soon2", dueDate: "2026-08-09" }),
      task({ id: "soon1", dueDate: "2026-08-02" }),
    ], today);
    expect(b.overdue.map((t) => t.id)).toEqual(["late1", "late2"]);
    expect(b.upcoming.map((t) => t.id)).toEqual(["soon1", "soon2"]);
  });
  it("preserves generic element type (TaskWithBusiness passes through)", () => {
    const withBiz = { ...task({ id: "w" }), businessName: "Joe's" };
    expect(bucketTasks([withBiz], today).anytime[0].businessName).toBe("Joe's");
  });
});
