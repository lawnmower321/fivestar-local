import type { Activity } from "./types";

// One-line display text per activity. Notes render their body; everything
// else derives from type + metadata (body is null except task_completed's
// task-title snapshot). Pure TS — no next/*.
export function activityLabel(a: Activity): string {
  switch (a.type) {
    case "note":
      return a.body ?? "";
    case "reply_posted":
      return "Posted a review reply";
    case "status_change": {
      const m = (a.metadata ?? {}) as { from?: string; to?: string };
      return `Status changed: ${m.from ?? "?"} \u2192 ${m.to ?? "?"}`;
    }
    case "kb_updated": {
      const m = (a.metadata ?? {}) as { section?: string };
      return m.section === "voice" ? "Voice guide updated" : "Knowledgebase updated";
    }
    case "task_completed":
      return a.body ? `Completed task: \u201c${a.body}\u201d` : "Completed a task";
  }
}
