import { getDb } from "@/lib/replydesk/db";
import { listActivities, listProfiles } from "@/lib/crm/db";
import { activityLabel } from "@/lib/crm/timeline";
import { NoteComposer } from "@/components/admin/note-composer";
import { DeleteNoteButton } from "@/components/admin/delete-note-button";
import { ACTIVITY_ICONS } from "@/components/admin/activity-icons";

export const dynamic = "force-dynamic";

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const [activities, profiles] = await Promise.all([listActivities(db, id), listProfiles(db)]);
  const nameOf = new Map(profiles.map((p) => [p.id, p.displayName]));
  return (
    <div className="max-w-2xl space-y-4">
      <NoteComposer businessId={id} />
      {activities.length === 0 ? (
        <p className="text-sm text-slate-500">No activity yet — notes, posted replies, KB saves, and status changes will show up here.</p>
      ) : (
        <ul className="space-y-2">
          {activities.map((a) => {
            const Icon = ACTIVITY_ICONS[a.type];
            return (
              <li key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <div className="flex min-w-0 items-start gap-2">
                  <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="min-w-0 break-words">
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{activityLabel(a)}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {a.userId ? (nameOf.get(a.userId) ?? "Former user") : "Former user"}
                      {" · "}
                      {new Date(a.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York" })}
                    </p>
                  </div>
                </div>
                {a.type === "note" && <DeleteNoteButton activityId={a.id} businessId={id} />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
