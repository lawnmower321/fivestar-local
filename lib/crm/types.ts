// CRM satellite-table types (activities now; tasks in Phase 4). Pure TS.
export const ACTIVITY_TYPES = [
  "note", "reply_posted", "status_change", "kb_updated", "task_completed",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type Activity = {
  id: string;
  businessId: string;
  userId: string | null;
  type: ActivityType;
  body: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type Profile = { id: string; displayName: string };
