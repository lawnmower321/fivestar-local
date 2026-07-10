import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Business, Review } from "./types";

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

export async function createBusiness(
  db: SupabaseClient, input: { name: string; reviewUrl?: string | null },
): Promise<Business> {
  const { data, error } = await db.from("businesses")
    .insert({ name: input.name, review_url: input.reviewUrl ?? null })
    .select("*").single();
  return rowToBusiness(must(data, error));
}

export async function updateBusiness(
  db: SupabaseClient, id: string,
  patch: Partial<{ kbMd: string; voiceMd: string; name: string; reviewUrl: string | null }>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.kbMd !== undefined) row.kb_md = patch.kbMd;
  if (patch.voiceMd !== undefined) row.voice_md = patch.voiceMd;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.reviewUrl !== undefined) row.review_url = patch.reviewUrl;
  const { error } = await db.from("businesses").update(row).eq("id", id);
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
    .order("posted_at", { ascending: false }).limit(limit);
  return must(data, error).map((r) => r.reply_text as string);
}

export async function markPosted(db: SupabaseClient, reviewId: string): Promise<void> {
  const { error } = await db.from("reviews")
    .update({ status: "posted", posted_at: new Date().toISOString() }).eq("id", reviewId);
  if (error) throw new Error(error.message);
}
