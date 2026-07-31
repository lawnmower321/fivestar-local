import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, ActivityType, Profile, Task, TaskWithBusiness } from "./types";

function must<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("not found");
  return data;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToActivity(r: any): Activity {
  return {
    id: r.id, businessId: r.business_id, userId: r.user_id, type: r.type,
    body: r.body, metadata: r.metadata, createdAt: r.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function insertActivity(
  db: SupabaseClient,
  a: { businessId: string; userId: string | null; type: ActivityType;
       body?: string | null; metadata?: Record<string, unknown> | null },
): Promise<void> {
  const { error } = await db.from("activities").insert({
    business_id: a.businessId, user_id: a.userId, type: a.type,
    body: a.body ?? null, metadata: a.metadata ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function listActivities(
  db: SupabaseClient, businessId: string, limit = 50,
): Promise<Activity[]> {
  const { data, error } = await db.from("activities").select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false }).limit(limit);
  return must(data, error).map(rowToActivity);
}

// The type filter in the query itself makes non-note deletion impossible at
// the db layer — not merely hidden in the UI. The business_id filter makes a
// mismatched (id, businessId) pair a no-op instead of deleting a note that
// belongs to a different client.
export async function deleteNoteActivity(db: SupabaseClient, id: string, businessId: string): Promise<void> {
  const { error } = await db.from("activities").delete()
    .eq("id", id).eq("type", "note").eq("business_id", businessId);
  if (error) throw new Error(error.message);
}

export async function listProfiles(db: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await db.from("profiles").select("id, display_name");
  return must(data, error).map((r) => ({ id: r.id, displayName: r.display_name }));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToTask(r: any): Task {
  return {
    id: r.id, businessId: r.business_id, assignee: r.assignee, title: r.title,
    dueDate: r.due_date, status: r.status, createdBy: r.created_by,
    createdAt: r.created_at, completedAt: r.completed_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function createTask(
  db: SupabaseClient,
  t: { businessId: string | null; assignee: string | null; title: string;
       dueDate: string | null; createdBy: string | null },
): Promise<Task> {
  const { data, error } = await db.from("tasks").insert({
    business_id: t.businessId, assignee: t.assignee, title: t.title,
    due_date: t.dueDate, created_by: t.createdBy,
  }).select("*").single();
  return rowToTask(must(data, error));
}

export async function listTasksForBusiness(db: SupabaseClient, businessId: string): Promise<Task[]> {
  const { data, error } = await db.from("tasks").select("*")
    .eq("business_id", businessId).order("created_at", { ascending: false });
  return must(data, error).map(rowToTask);
}

export async function listAllTasks(db: SupabaseClient): Promise<TaskWithBusiness[]> {
  const { data, error } = await db.from("tasks").select("*, businesses(name)")
    .order("created_at", { ascending: false });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return must(data, error).map((r: any) => ({
    ...rowToTask(r), businessName: r.businesses?.name ?? null,
  }));
}

export async function completeTask(db: SupabaseClient, id: string): Promise<Task> {
  const { data, error } = await db.from("tasks")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id).select("*").single();
  return rowToTask(must(data, error));
}

export async function reopenTask(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("tasks")
    .update({ status: "open", completed_at: null }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTask(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function listRecentActivities(
  db: SupabaseClient, limit = 10,
): Promise<(Activity & { businessName: string })[]> {
  const { data, error } = await db.from("activities").select("*, businesses(name)")
    .order("created_at", { ascending: false }).limit(limit);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return must(data, error).map((r: any) => ({
    ...rowToActivity(r), businessName: r.businesses?.name ?? "",
  }));
}
