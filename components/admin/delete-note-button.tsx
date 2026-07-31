"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { deleteNoteAction } from "@/app/admin/actions";

export function DeleteNoteButton({ activityId, businessId }: { activityId: string; businessId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-label="Delete note"
      disabled={pending}
      onClick={() => startTransition(() => deleteNoteAction(activityId, businessId))}
      className="text-slate-300 hover:text-gred disabled:opacity-50"
    >
      <X className="size-4" />
    </button>
  );
}
