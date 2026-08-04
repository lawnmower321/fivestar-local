import { z } from "zod";

// The only zod schema on this site a stranger can reach — every other action
// sits behind requireUser(). Assume hostile input: bound every string so a
// scripted submitter cannot write megabytes into the table.

export const MAX_NAME = 120;
export const MAX_EMAIL = 160;
export const MAX_NOTE = 500;

export const leadSchema = z.object({
  businessName: z.string().trim().min(1, "Tell us your business name").max(MAX_NAME),
  email: z.email("That doesn't look like an email address").max(MAX_EMAIL),
  // Empty-string input from an untouched textarea degrades to null.
  note: z.string().trim().max(MAX_NOTE).transform((s) => (s === "" ? null : s)),
});

export type LeadInput = z.infer<typeof leadSchema>;

export type LeadResult = { ok: true } | { ok: false; error: string };

/**
 * Honeypot check. The form renders a visually-hidden "website" field that a
 * human never sees and therefore never fills; a naive bot fills every input
 * it finds. Deliberately separate from leadSchema so the caller can answer a
 * bot with the same success shape a human gets — a validation error would
 * tell an attacker the field is a trap.
 */
export function isBot(honeypot: string): boolean {
  return honeypot.trim().length > 0;
}
