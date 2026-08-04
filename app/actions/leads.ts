"use server";

import { getDb } from "@/lib/replydesk/db";
import { insertLead } from "@/lib/leads/db";
import { isBot, leadSchema, type LeadResult } from "@/lib/leads/schema";
import { content } from "@/lib/content";

export async function submitLeadAction(
  _prev: LeadResult | null,
  formData: FormData,
): Promise<LeadResult> {
  // Honeypot first, and answered with success: probing the form teaches an
  // attacker nothing, and nothing is written.
  if (isBot(String(formData.get("website") ?? ""))) return { ok: true };

  const parsed = leadSchema.safeParse({
    businessName: formData.get("businessName"),
    email: formData.get("email"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  try {
    await insertLead(getDb(), parsed.data);
  } catch {
    // Never surface the DB error — it can carry schema detail. Give the
    // prospect a path that still works if our database is down.
    return { ok: false, error: `Something went wrong on our end. Email us at ${content.site.email} instead.` };
  }

  return { ok: true };
}
