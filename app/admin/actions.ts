"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, createBusiness, getBusiness, updateBusiness, insertReview, markPosted, recentPostedReplies, deleteBusiness } from "@/lib/replydesk/db";
import { getOpenRouter } from "@/lib/replydesk/ai/client";
import { generateReply } from "@/lib/replydesk/ai/generate-reply";
import { buildKnowledgebase } from "@/lib/replydesk/ai/build-knowledgebase";
import { extractVoice } from "@/lib/replydesk/ai/extract-voice";
import { requireUser } from "./require-user";
import { getAuthClient } from "./auth-client";
import {
  createBusinessSchema, saveKbSchema, saveVoiceSchema, buildKbFromUrlSchema,
  buildKbFromTextSchema, extractVoiceSchema, generateReplySchema,
  markPostedSchema, deleteBusinessSchema,
} from "./schemas";

export async function createBusinessAction(formData: FormData): Promise<void> {
  await requireUser();
  const input = createBusinessSchema.parse({
    name: String(formData.get("name") ?? ""),
    reviewUrl: String(formData.get("reviewUrl") ?? ""),
  });
  const b = await createBusiness(getDb(), input);
  redirect(`/admin/businesses/${b.id}`);
}

export async function saveKbAction(businessId: string, kbMd: string): Promise<void> {
  await requireUser();
  const input = saveKbSchema.parse({ businessId, kbMd });
  await updateBusiness(getDb(), input.businessId, { kbMd: input.kbMd });
  revalidatePath(`/admin/businesses/${input.businessId}`);
}

export async function saveVoiceAction(businessId: string, voiceMd: string): Promise<void> {
  await requireUser();
  const input = saveVoiceSchema.parse({ businessId, voiceMd });
  await updateBusiness(getDb(), input.businessId, { voiceMd: input.voiceMd });
  revalidatePath(`/admin/businesses/${input.businessId}`);
}

export async function buildKbFromUrlAction(businessId: string, url: string): Promise<string> {
  await requireUser();
  const input = buildKbFromUrlSchema.parse({ businessId, url });
  return buildKnowledgebase(getOpenRouter(), { kind: "url", url: input.url });
}

export async function buildKbFromTextAction(businessId: string, raw: string): Promise<string> {
  await requireUser();
  const input = buildKbFromTextSchema.parse({ businessId, raw });
  return buildKnowledgebase(getOpenRouter(), { kind: "text", raw: input.raw });
}

export async function extractVoiceAction(businessId: string, pastReplies: string): Promise<string> {
  await requireUser();
  const input = extractVoiceSchema.parse({ businessId, pastReplies });
  return extractVoice(getOpenRouter(), input.pastReplies);
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
  await requireUser();
  const p = generateReplySchema.parse(input);
  const db = getDb();
  const business = await getBusiness(db, p.businessId);
  const recent = await recentPostedReplies(db, p.businessId, 10);
  const out = await generateReply(getOpenRouter(), {
    businessName: business.name,
    kbMd: business.kbMd,
    voiceMd: business.voiceMd,
    recentReplies: recent,
    reviewText: p.reviewText,
    reviewer: p.reviewer || null,
    rating: p.rating,
  });
  const saved = await insertReview(db, {
    businessId: p.businessId,
    rating: p.rating,
    reviewer: p.reviewer || null,
    reviewText: p.reviewText,
    replyText: out.reply,
    detailReferenced: out.detailReferenced,
    similarity: out.gate.similarity,
    flags: out.gate.reasons,
  });
  revalidatePath(`/admin/businesses/${p.businessId}`);
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
  await requireUser();
  const input = markPostedSchema.parse({ reviewId, businessId });
  await markPosted(getDb(), input.reviewId);
  revalidatePath(`/admin/businesses/${input.businessId}`);
}

export async function deleteBusinessAction(businessId: string): Promise<{ error: string } | void> {
  await requireUser();
  const input = deleteBusinessSchema.parse({ businessId });
  try {
    await deleteBusiness(getDb(), input.businessId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Delete failed — try again." };
  }
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await requireUser();
  const supabase = await getAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
