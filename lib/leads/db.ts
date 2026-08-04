import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadInput } from "./schema";

// Injected client, never constructed here — same rule as lib/crm/db.ts and
// lib/replydesk/db.ts.
export async function insertLead(db: SupabaseClient, lead: LeadInput): Promise<void> {
  const { error } = await db.from("leads").insert({
    business_name: lead.businessName,
    email: lead.email,
    note: lead.note,
    source: "landing",
  });
  if (error) throw new Error(error.message);
}
