import Link from "next/link";
import { getDb } from "@/lib/replydesk/db";
import { listAllTasks, listProfiles, listRecentActivities } from "@/lib/crm/db";
import { bucketTasks } from "@/lib/crm/tasks";
import { FOUNDER_TZ, todayInTimeZone, isOverdue } from "@/lib/crm/dates";
import { activityLabel } from "@/lib/crm/timeline";
import { TaskItem } from "@/components/admin/task-item";
import { ACTIVITY_ICONS } from "@/components/admin/activity-icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const db = getDb();
  const [tasks, profiles, recent] = await Promise.all([
    listAllTasks(db), listProfiles(db), listRecentActivities(db, 10),
  ]);
  const nameOf = new Map(profiles.map((p) => [p.id, p.displayName]));
  const today = todayInTimeZone(FOUNDER_TZ);
  const b = bucketTasks(tasks, today);
  const due = [...b.overdue, ...b.today];
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-heading text-2xl font-bold text-slate-900">Today</h1>
      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Due today &amp; overdue
          </h2>
          <Link href="/admin/tasks" className="text-sm text-gblue hover:underline">All tasks →</Link>
        </div>
        {due.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing due — check <Link href="/admin/tasks" className="text-gblue hover:underline">the full list</Link> for upcoming and anytime tasks.</p>
        ) : (
          <ul className="space-y-2">
            {due.map((t) => (
              <TaskItem key={t.id} task={t} businessName={t.businessName}
                assigneeName={t.assignee ? (nameOf.get(t.assignee) ?? null) : null}
                overdue={isOverdue(t.dueDate, today)} />
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Recent activity</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((a) => {
              const Icon = ACTIVITY_ICONS[a.type];
              return (
                <li key={a.id} className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800">{activityLabel(a)}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {a.businessName ? (
                        <Link href={`/admin/clients/${a.businessId}/timeline`} className="hover:text-gblue hover:underline">
                          {a.businessName}
                        </Link>
                      ) : (
                        "Unknown client"
                      )}
                      {" · "}
                      {a.userId ? (nameOf.get(a.userId) ?? "Former user") : "Former user"}
                      {" · "}
                      {new Date(a.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: FOUNDER_TZ })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
