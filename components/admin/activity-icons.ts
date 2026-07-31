import { StickyNote, MessageSquare, ArrowRightLeft, BookOpen, CheckCircle2 } from "lucide-react";
import type { ActivityType } from "@/lib/crm/types";

// One muted icon per activity type — shared by the client Timeline tab and
// the cross-client dashboard's "Recent activity" list so the same activity
// data looks the same in both places (a note whose text happens to read like
// a system event, e.g. "Posted a review reply", still stays visually distinct).
export const ACTIVITY_ICONS: Record<ActivityType, typeof StickyNote> = {
  note: StickyNote,
  reply_posted: MessageSquare,
  status_change: ArrowRightLeft,
  kb_updated: BookOpen,
  task_completed: CheckCircle2,
};
