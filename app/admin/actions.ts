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
import { canDeleteBusiness } from "@/lib/crm/status";
import { insertActivity, deleteNoteActivity, createTask, completeTask, reopenTask, deleteTask } from "@/lib/crm/db";
import {
  createBusinessSchema, saveKbSchema, saveVoiceSchema, buildKbFromUrlSchema,
  buildKbFromTextSchema, extractVoiceSchema, generateReplySchema,
  markPostedSchema, deleteBusinessSchema, updateClientSchema,
  addNoteSchema, deleteNoteSchema,
  createTaskSchema, setTaskStatusSchema, deleteTaskSchema,
} from "./schemas";

export async function createBusinessAction(formData: FormData): Promise<void> {
  await requireUser();
  const input = createBusinessSchema.parse({
    name: String(formData.get("name") ?? ""),
    reviewUrl: String(formData.get("reviewUrl") ?? ""),
  });
  const b = await createBusiness(getDb(), input);
  redirect(`/admin/clients/${b.id}`);
}

export async function saveKbAction(businessId: string, kbMd: string): Promise<void> {
  const user = await requireUser();
  const input = saveKbSchema.parse({ businessId, kbMd });
  const db = getDb();
  await updateBusiness(db, input.businessId, { kbMd: input.kbMd });
  await insertActivity(db, {
    businessId: input.businessId, userId: user.id,
    type: "kb_updated", metadata: { section: "kb" },
  });
  revalidatePath(`/admin/clients/${input.businessId}`, "layout");
}

export async function saveVoiceAction(businessId: string, voiceMd: string): Promise<void> {
  const user = await requireUser();
  const input = saveVoiceSchema.parse({ businessId, voiceMd });
  const db = getDb();
  await updateBusiness(db, input.businessId, { voiceMd: input.voiceMd });
  await insertActivity(db, {
    businessId: input.businessId, userId: user.id,
    type: "kb_updated", metadata: { section: "voice" },
  });
  revalidatePath(`/admin/clients/${input.businessId}`, "layout");
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
  revalidatePath(`/admin/clients/${p.businessId}/replydesk`);
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
  const user = await requireUser();
  const input = markPostedSchema.parse({ reviewId, businessId });
  const db = getDb();
  await markPosted(db, input.reviewId);
  await insertActivity(db, {
    businessId: input.businessId, userId: user.id,
    type: "reply_posted", metadata: { review_id: input.reviewId },
  });
  revalidatePath(`/admin/clients/${input.businessId}`, "layout");
}

export async function deleteBusinessAction(businessId: string): Promise<{ error: string } | void> {
  await requireUser();
  const input = deleteBusinessSchema.parse({ businessId });
  try {
    const db = getDb();
    const business = await getBusiness(db, input.businessId);
    if (!canDeleteBusiness(business.status)) {
      return { error: "Only leads can be deleted — set the status to Churned instead." };
    }
    await deleteBusiness(db, input.businessId);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Delete failed — try again." };
  }
  redirect("/admin/clients");
}

export async function updateClientDetailsAction(
  businessId: string,
  details: {
    status: string;
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    reviewUrl: string;
  },
): Promise<{ error: string } | void> {
  const user = await requireUser();
  const input = updateClientSchema.parse({ businessId, ...details });
  const db = getDb();
  let before: Awaited<ReturnType<typeof getBusiness>>;
  try {
    before = await getBusiness(db, input.businessId);
    await updateBusiness(db, input.businessId, {
      status: input.status,
      contactName: input.contactName,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      reviewUrl: input.reviewUrl,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Save failed — try again." };
  }
  if (before.status !== input.status) {
    await insertActivity(db, {
      businessId: input.businessId, userId: user.id,
      type: "status_change", metadata: { from: before.status, to: input.status },
    });
  }
  revalidatePath(`/admin/clients/${input.businessId}`, "layout");
}

export async function addNoteAction(businessId: string, body: string): Promise<void> {
  const user = await requireUser();
  const input = addNoteSchema.parse({ businessId, body });
  await insertActivity(getDb(), {
    businessId: input.businessId, userId: user.id, type: "note", body: input.body,
  });
  revalidatePath(`/admin/clients/${input.businessId}/timeline`);
}

export async function deleteNoteAction(activityId: string, businessId: string): Promise<void> {
  await requireUser();
  const input = deleteNoteSchema.parse({ activityId, businessId });
  await deleteNoteActivity(getDb(), input.activityId, input.businessId);
  revalidatePath(`/admin/clients/${input.businessId}/timeline`);
}

function revalidateTaskSurfaces(businessId: string | null): void {
  revalidatePath("/admin");
  revalidatePath("/admin/tasks");
  if (businessId) revalidatePath(`/admin/clients/${businessId}`, "layout");
}

export async function createTaskAction(input: {
  businessId: string; title: string; dueDate: string; assignee: string;
}): Promise<{ error: string } | void> {
  const user = await requireUser();
  const p = createTaskSchema.parse(input);
  try {
    await createTask(getDb(), {
      businessId: p.businessId, assignee: p.assignee, title: p.title,
      dueDate: p.dueDate, createdBy: user.id,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Create failed — try again." };
  }
  revalidateTaskSurfaces(p.businessId);
}

export async function setTaskStatusAction(taskId: string, businessId: string, done: boolean): Promise<void> {
  const user = await requireUser();
  const p = setTaskStatusSchema.parse({ taskId, businessId, done });
  const db = getDb();
  if (p.done) {
    const task = await completeTask(db, p.taskId);
    // task_completed lands on the client timeline only for client-linked
    // tasks (spec: general to-dos have no timeline). Title snapshot in body
    // so history survives task deletion.
    if (task.businessId) {
      await insertActivity(db, {
        businessId: task.businessId, userId: user.id,
        type: "task_completed", body: task.title,
      });
    }
  } else {
    await reopenTask(db, p.taskId);
  }
  revalidateTaskSurfaces(p.businessId);
}

export async function deleteTaskAction(taskId: string, businessId: string): Promise<void> {
  await requireUser();
  const p = deleteTaskSchema.parse({ taskId, businessId });
  await deleteTask(getDb(), p.taskId);
  revalidateTaskSurfaces(p.businessId);
}

export async function logoutAction(): Promise<void> {
  await requireUser();
  const supabase = await getAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
