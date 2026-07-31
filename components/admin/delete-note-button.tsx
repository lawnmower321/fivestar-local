"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { deleteNoteAction } from "@/app/admin/actions";

export function DeleteNoteButton({ activityId, businessId }: { activityId: string; businessId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        aria-label="Delete note"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            try {
              await deleteNoteAction(activityId, businessId);
              setError(null);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not delete note.");
            }
          })
        }
        className="text-slate-500 hover:text-gred disabled:opacity-50"
      >
        <X className="size-4" />
      </button>
      {error && <p className="text-xs text-gred">{error}</p>}
    </div>
  );
}
