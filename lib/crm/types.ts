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

export type TaskStatus = "open" | "done";

export type Task = {
  id: string;
  businessId: string | null;
  assignee: string | null;
  title: string;
  dueDate: string | null;     // YYYY-MM-DD
  status: TaskStatus;
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type TaskWithBusiness = Task & { businessName: string | null };
