"use client";

import { useRef, useState, useTransition } from "react";
import { addNoteAction } from "@/app/admin/actions";

export function NoteComposer({ businessId }: { businessId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <form
      ref={formRef}
      action={(fd: FormData) => {
        const body = String(fd.get("body") ?? "").trim();
        if (!body) return;
        startTransition(async () => {
          try {
            await addNoteAction(businessId, body);
            formRef.current?.reset();
            setError(null);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not add note.");
          }
        });
      }}
      className="rounded-xl border border-slate-200 bg-white p-4"
    >
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Add a note…"
        aria-label="Add a note"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue"
      />
      <div className="mt-2 flex items-center justify-end gap-3">
        {error && <p className="text-sm text-gred">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-gblue px-3 py-1.5 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add note"}
        </button>
      </div>
    </form>
  );
}
