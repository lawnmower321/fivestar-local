import { getDb, listBusinesses } from "@/lib/replydesk/db";
import { listAllTasks, listProfiles } from "@/lib/crm/db";
import { bucketTasks } from "@/lib/crm/tasks";
import { FOUNDER_TZ, todayInTimeZone, isOverdue } from "@/lib/crm/dates";
import { TaskForm } from "@/components/admin/task-form";
import { TaskItem } from "@/components/admin/task-item";
import type { TaskWithBusiness } from "@/lib/crm/types";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const db = getDb();
  const [tasks, profiles, businesses] = await Promise.all([
    listAllTasks(db), listProfiles(db), listBusinesses(db),
  ]);
  const nameOf = new Map(profiles.map((p) => [p.id, p.displayName]));
  const today = todayInTimeZone(FOUNDER_TZ);
  const b = bucketTasks(tasks, today);
  const sections: [string, TaskWithBusiness[]][] = [
    ["Overdue", b.overdue], ["Today", b.today], ["Upcoming", b.upcoming],
    ["Anytime", b.anytime], ["Done", b.done],
  ];
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Tasks</h1>
      <TaskForm profiles={profiles} businesses={businesses.map((x) => ({ id: x.id, name: x.name }))} />
      {tasks.length === 0 && <p className="text-sm text-slate-500">Nothing to do — add the first task above.</p>}
      {sections.map(([label, items]) => items.length > 0 && (
        <section key={label}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</h2>
          <ul className="space-y-2">
            {items.map((t) => (
              <TaskItem key={t.id} task={t} businessName={t.businessName}
                assigneeName={t.assignee ? (nameOf.get(t.assignee) ?? null) : null}
                overdue={isOverdue(t.dueDate, today)} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
