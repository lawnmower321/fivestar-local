"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { setTaskStatusAction, deleteTaskAction } from "@/app/admin/actions";
import type { Task } from "@/lib/crm/types";

// checked={done} is driven straight off the server-fetched `task` prop, not
// local optimistic state — so if either action throws, the prop the parent
// passed down never changed (no revalidate ran) and the checkbox never
// visually toggles in the first place; it stays exactly where server truth
// says it is, and the caught error renders inline below the row.
export function TaskItem({ task, businessName, assigneeName, overdue }: {
  task: Task;
  businessName?: string | null;
  assigneeName: string | null;
  overdue: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const done = task.status === "done";
  return (
    <li className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={done}
          disabled={pending}
          aria-label={done ? `Reopen "${task.title}"` : `Complete "${task.title}"`}
          onChange={() =>
            startTransition(async () => {
              try {
                await setTaskStatusAction(task.id, task.businessId ?? "", !done);
                setError(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not update task.");
              }
            })
          }
          className="size-4 accent-gblue"
        />
        <div className="min-w-0 flex-1">
          <p className={done ? "truncate text-sm text-slate-400 line-through" : "truncate text-sm text-slate-800"}>
            {task.title}
          </p>
          <p className="text-xs text-slate-400">
            {businessName && task.businessId && (
              <>
                <Link href={`/admin/clients/${task.businessId}`} className="hover:text-gblue hover:underline">
                  {businessName}
                </Link>
                {" · "}
              </>
            )}
            {assigneeName ?? "Either of us"}
            {task.dueDate && (
              <>
                {" · "}
                <span className={overdue && !done ? "font-medium text-gred" : undefined}>
                  due {task.dueDate}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Delete "${task.title}"`}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await deleteTaskAction(task.id, task.businessId ?? "");
                setError(null);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Could not delete task.");
              }
            })
          }
          className="text-slate-500 hover:text-gred disabled:opacity-50"
        >
          <X className="size-4" />
        </button>
      </div>
      {error && <p className="text-xs text-gred">{error}</p>}
    </li>
  );
}
