"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, createBusiness, getBusiness, updateBusiness, insertReview, markPosted, recentPostedReplies } from "@/lib/replydesk/db";
import { getOpenRouter } from "@/lib/replydesk/ai/client";
import { generateReply } from "@/lib/replydesk/ai/generate-reply";
import { buildKnowledgebase } from "@/lib/replydesk/ai/build-knowledgebase";
import { extractVoice } from "@/lib/replydesk/ai/extract-voice";
import { requireSession } from "./require-session";

export async function createBusinessAction(formData: FormData): Promise<void> {
  await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const rawUrl = String(formData.get("reviewUrl") ?? "").trim();
  // Only persist a review URL that is an http(s) link — drop anything else
  // (e.g. a javascript: URL) so it can never reach an <a href>.
  const reviewUrl = rawUrl && /^https?:\/\//.test(rawUrl) ? rawUrl : null;
  const b = await createBusiness(getDb(), { name, reviewUrl });
  redirect(`/admin/businesses/${b.id}`);
}

export async function saveKbAction(businessId: string, kbMd: string): Promise<void> {
  await requireSession();
  await updateBusiness(getDb(), businessId, { kbMd });
  revalidatePath(`/admin/businesses/${businessId}`);
}

export async function saveVoiceAction(businessId: string, voiceMd: string): Promise<void> {
  await requireSession();
  await updateBusiness(getDb(), businessId, { voiceMd });
  revalidatePath(`/admin/businesses/${businessId}`);
}

export async function buildKbFromUrlAction(_businessId: string, url: string): Promise<string> {
  await requireSession();
  if (!/^https?:\/\//.test(url)) throw new Error("URL must start with http(s)://");
  return buildKnowledgebase(getOpenRouter(), { kind: "url", url });
}

export async function buildKbFromTextAction(_businessId: string, raw: string): Promise<string> {
  await requireSession();
  return buildKnowledgebase(getOpenRouter(), { kind: "text", raw });
}

export async function extractVoiceAction(_businessId: string, pastReplies: string): Promise<string> {
  await requireSession();
  return extractVoice(getOpenRouter(), pastReplies);
}

export async function generateReplyAction(input: {
  businessId: string;
  rating: number;
  reviewer: string;
  reviewText: string;
}): Promise<{
  reviewId: string; reply: string; detailReferenced: string;
  ok: boolean; hardFail: boolean; reasons: string[]; attempts: number;
}> {
  await requireSession();
  const db = getDb();
  const business = await getBusiness(db, input.businessId);
  const recent = await recentPostedReplies(db, input.businessId, 10);
  const out = await generateReply(getOpenRouter(), {
    businessName: business.name,
    kbMd: business.kbMd,
    voiceMd: business.voiceMd,
    recentReplies: recent,
    reviewText: input.reviewText,
    reviewer: input.reviewer || null,
    rating: input.rating,
  });
  const saved = await insertReview(db, {
    businessId: input.businessId,
    rating: input.rating,
    reviewer: input.reviewer || null,
    reviewText: input.reviewText,
    replyText: out.reply,
    detailReferenced: out.detailReferenced,
    similarity: out.gate.similarity,
    flags: out.gate.reasons,
  });
  revalidatePath(`/admin/businesses/${input.businessId}`);
  return {
    reviewId: saved.id,
    reply: out.reply,
    detailReferenced: out.detailReferenced,
    ok: out.gate.ok,
    hardFail: out.gate.hardFail,
    reasons: out.gate.reasons,
    attempts: out.attempts,
  };
}

export async function markPostedAction(reviewId: string, businessId: string): Promise<void> {
  await requireSession();
  await markPosted(getDb(), reviewId);
  revalidatePath(`/admin/businesses/${businessId}`);
}
