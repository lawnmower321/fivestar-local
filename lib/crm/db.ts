import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, ActivityType, Profile } from "./types";

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
// the db layer — not merely hidden in the UI.
export async function deleteNoteActivity(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("activities").delete()
    .eq("id", id).eq("type", "note");
  if (error) throw new Error(error.message);
}

export async function listProfiles(db: SupabaseClient): Promise<Profile[]> {
  const { data, error } = await db.from("profiles").select("*");
  return must(data, error).map((r) => ({ id: r.id, displayName: r.display_name }));
}
