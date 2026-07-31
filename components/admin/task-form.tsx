"use client";

import { useState, useTransition } from "react";
import { createTaskAction } from "@/app/admin/actions";
import type { Profile } from "@/lib/crm/types";

// Controlled inputs throughout (not useRef + form.reset()): React 19 calls
// requestFormReset before invoking the action, which would blank an
// uncontrolled form the instant the user submits — so when createTaskAction
// returns {error}, the error would render over an empty form with the
// user's typed title already gone. State is only cleared on success.
export function TaskForm({ businessId, profiles, businesses }: {
  businessId?: string;
  profiles: Profile[];
  businesses?: { id: string; name: string }[];
}) {
  const [title, setTitle] = useState("");
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const selectCls = "rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-gblue";
  return (
    <form
      action={() => {
        const trimmed = title.trim();
        if (!trimmed) {
          setError("Title can't be empty.");
          return;
        }
        startTransition(async () => {
          const result = await createTaskAction({
            businessId: businessId ?? selectedBusinessId,
            title: trimmed,
            dueDate,
            assignee,
          });
          if (result?.error) {
            setError(result.error);
          } else {
            setError(null);
            setTitle("");
            setSelectedBusinessId("");
            setDueDate("");
            setAssignee("");
          }
        });
      }}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3"
    >
      <input
        name="title"
        required
        placeholder="New task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-gblue"
      />
      {!businessId && businesses && (
        <select
          name="businessId"
          value={selectedBusinessId}
          onChange={(e) => setSelectedBusinessId(e.target.value)}
          className={selectCls}
        >
          <option value="">No client</option>
          {businesses.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      )}
      <input
        name="dueDate"
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className={selectCls}
      />
      <select
        name="assignee"
        value={assignee}
        onChange={(e) => setAssignee(e.target.value)}
        className={selectCls}
      >
        <option value="">Either of us</option>
        {profiles.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
      </select>
      <button type="submit" disabled={pending}
        className="rounded-lg bg-gblue px-3 py-1.5 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50">
        {pending ? "Adding…" : "Add"}
      </button>
      {error && <p className="w-full text-sm text-gred">{error}</p>}
    </form>
  );
}
