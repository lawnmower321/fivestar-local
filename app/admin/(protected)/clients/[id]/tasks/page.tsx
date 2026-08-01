import { getDb } from "@/lib/replydesk/db";
import { listTasksForBusiness, listProfiles } from "@/lib/crm/db";
import { bucketTasks } from "@/lib/crm/tasks";
import { FOUNDER_TZ, todayInTimeZone, isOverdue } from "@/lib/crm/dates";
import { TaskForm } from "@/components/admin/task-form";
import { TaskItem } from "@/components/admin/task-item";
import type { Task } from "@/lib/crm/types";

export const dynamic = "force-dynamic";

export default async function ClientTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [tasks, profiles] = await Promise.all([listTasksForBusiness(db, id), listProfiles(db)]);
  const nameOf = new Map(profiles.map((p) => [p.id, p.displayName]));
  const today = todayInTimeZone(FOUNDER_TZ);
  const b = bucketTasks(tasks, today);
  const sections: [string, Task[]][] = [
    ["Overdue", b.overdue], ["Today", b.today], ["Upcoming", b.upcoming],
    ["Anytime", b.anytime], ["Done", b.done],
  ];
  return (
    <div className="max-w-2xl space-y-5">
      <TaskForm businessId={id} profiles={profiles} />
      {tasks.length === 0 && <p className="text-sm text-slate-500">No tasks for this client yet.</p>}
      {sections.map(([label, items]) => items.length > 0 && (
        <section key={label}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</h2>
          <ul className="space-y-2">
            {items.map((t) => (
              <TaskItem key={t.id} task={t}
                assigneeName={t.assignee ? (nameOf.get(t.assignee) ?? null) : null}
                overdue={isOverdue(t.dueDate, today)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
