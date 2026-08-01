import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Business, Review, ReviewMeta } from "./types";
import type { ClientStatus } from "../crm/status";

export function getDb(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToBusiness(r: any): Business {
  return {
    id: r.id, name: r.name, reviewUrl: r.review_url,
    kbMd: r.kb_md, voiceMd: r.voice_md, createdAt: r.created_at,
    status: r.status, contactName: r.contact_name,
    contactEmail: r.contact_email, contactPhone: r.contact_phone,
  };
}

function rowToReview(r: any): Review {
  return {
    id: r.id, businessId: r.business_id, rating: r.rating, reviewer: r.reviewer,
    reviewText: r.review_text, replyText: r.reply_text,
    detailReferenced: r.detail_referenced, similarity: r.similarity,
    flags: r.flags ?? [], status: r.status, createdAt: r.created_at, postedAt: r.posted_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function must<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("not found");
  return data;
}

export async function listBusinesses(db: SupabaseClient): Promise<Business[]> {
  const { data, error } = await db.from("businesses").select("*").order("name");
  return must(data, error).map(rowToBusiness);
}

export async function getBusiness(db: SupabaseClient, id: string): Promise<Business> {
  const { data, error } = await db.from("businesses").select("*").eq("id", id).single();
  return rowToBusiness(must(data, error));
}

// Nullable variant of getBusiness: returns null on a missing row instead of
// throwing, so route code can convert a miss to Next's notFound() (this file
// never imports next/*, so it can't call notFound() itself). getBusiness is
// kept for existing callers that want a throw-on-missing contract.
export async function findBusiness(db: SupabaseClient, id: string): Promise<Business | null> {
  const { data, error } = await db.from("businesses").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToBusiness(data) : null;
}

export async function createBusiness(
  db: SupabaseClient, input: { name: string; reviewUrl?: string | null },
): Promise<Business> {
  const { data, error } = await db.from("businesses")
    .insert({ name: input.name, review_url: input.reviewUrl ?? null })
    .select("*").single();
  return rowToBusiness(must(data, error));
}

// Status is deliberately not a patch field here — every status change must
// go through setStatusWithPending so the pending_status_change marker stays
// in sync with the column (see below).
export async function updateBusiness(
  db: SupabaseClient, id: string,
  patch: Partial<{
    kbMd: string; voiceMd: string; name: string; reviewUrl: string | null;
    contactName: string | null;
    contactEmail: string | null; contactPhone: string | null;
  }>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.kbMd !== undefined) row.kb_md = patch.kbMd;
  if (patch.voiceMd !== undefined) row.voice_md = patch.voiceMd;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.reviewUrl !== undefined) row.review_url = patch.reviewUrl;
  if (patch.contactName !== undefined) row.contact_name = patch.contactName;
  if (patch.contactEmail !== undefined) row.contact_email = patch.contactEmail;
  if (patch.contactPhone !== undefined) row.contact_phone = patch.contactPhone;
  const { error } = await db.from("businesses").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

// The status_change activity that is still owed for `id`, if a prior
// updateClientDetailsAction call updated the status column but then failed
// to record the activity. null means nothing is outstanding.
export async function getPendingStatusChange(
  db: SupabaseClient, id: string,
): Promise<{ from: ClientStatus; to: ClientStatus } | null> {
  const { data, error } = await db.from("businesses")
    .select("pending_status_change").eq("id", id).single();
  const row = must(data, error) as { pending_status_change: { from: ClientStatus; to: ClientStatus } | null };
  return row.pending_status_change;
}

// Sets the new status and records the transition as pending in the same
// UPDATE statement (one Postgres row write is atomic), so a subsequent
// activity-write failure never loses track of which transition is owed.
export async function setStatusWithPending(
  db: SupabaseClient, id: string, from: ClientStatus, to: ClientStatus,
): Promise<void> {
  const { error } = await db.from("businesses")
    .update({ status: to, pending_status_change: { from, to } })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// Clears the pending marker once its status_change activity has been
// recorded.
export async function clearPendingStatusChange(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("businesses")
    .update({ pending_status_change: null }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertReview(
  db: SupabaseClient,
  r: { businessId: string; rating: number; reviewer: string | null; reviewText: string;
       replyText: string | null; detailReferenced: string | null; similarity: number | null;
       flags: string[] },
): Promise<Review> {
  const { data, error } = await db.from("reviews").insert({
    business_id: r.businessId, rating: r.rating, reviewer: r.reviewer,
    review_text: r.reviewText, reply_text: r.replyText,
    detail_referenced: r.detailReferenced, similarity: r.similarity, flags: r.flags,
  }).select("*").single();
  return rowToReview(must(data, error));
}

export async function listReviews(
  db: SupabaseClient, businessId: string, limit = 50,
): Promise<Review[]> {
  const { data, error } = await db.from("reviews").select("*")
    .eq("business_id", businessId).order("created_at", { ascending: false }).limit(limit);
  return must(data, error).map(rowToReview);
}

export async function recentPostedReplies(
  db: SupabaseClient, businessId: string, limit = 10,
): Promise<string[]> {
  const { data, error } = await db.from("reviews").select("reply_text")
    .eq("business_id", businessId).eq("status", "posted")
    .not("reply_text", "is", null)
    .order("posted_at", { ascending: false, nullsFirst: false }).limit(limit);
  return must(data, error).map((r) => r.reply_text as string);
}

export async function markPosted(db: SupabaseClient, reviewId: string): Promise<void> {
  const { error } = await db.from("reviews")
    .update({ status: "posted", posted_at: new Date().toISOString() }).eq("id", reviewId);
  if (error) throw new Error(error.message);
}

export async function deleteBusiness(db: SupabaseClient, id: string): Promise<void> {
  const { error } = await db.from("businesses").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function countReviews(db: SupabaseClient, businessId: string): Promise<number> {
  const { count, error } = await db.from("reviews")
    .select("*", { count: "exact", head: true }).eq("business_id", businessId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function recentPostedAcrossClients(
  db: SupabaseClient, limit = 20,
): Promise<{ review: Review; businessName: string | null }[]> {
  const { data, error } = await db.from("reviews").select("*, businesses(name)")
    .eq("status", "posted")
    .order("posted_at", { ascending: false, nullsFirst: false }).limit(limit);
  // Missing joined business maps to null (not ""), matching
  // lib/crm/db.listRecentActivities/listAllTasks's convention, so a renderer
  // can't mistake an empty string for a real (if blank) business name.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return must(data, error).map((r: any) => ({
    review: rowToReview(r), businessName: r.businesses?.name ?? null,
  }));
}

// The whole result feeds buildAttention (lib/crm/attention.ts), which needs
// only the LATEST review row per client for the draft signal and the newest
// posted_at for the staleness signal — ordering newest-first means the row
// cap below truncates to the newest rows instead of an arbitrary unordered
// slice, which is what both signals need to stay correct. 1000 comfortably
// covers realistic review + draft-regeneration volume across all active
// clients combined; it's a defensive bound against `reviews` growing without
// limit as an audit trail, not a number expected to bind in practice.
const REVIEW_META_ROW_CAP = 1000;

export async function listReviewMeta(
  db: SupabaseClient, businessIds: string[],
): Promise<ReviewMeta[]> {
  if (businessIds.length === 0) return [];
  const { data, error } = await db.from("reviews")
    .select("business_id, status, created_at, posted_at")
    .in("business_id", businessIds)
    .order("created_at", { ascending: false })
    .limit(REVIEW_META_ROW_CAP);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return must(data, error).map((r: any) => ({
    businessId: r.business_id, status: r.status,
    createdAt: r.created_at, postedAt: r.posted_at,
  }));
}
