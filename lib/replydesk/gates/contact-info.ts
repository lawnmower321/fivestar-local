// HARD gate: a public review reply must never contain direct contact info.
// (Google moderation + our own policy — see docs/replydesk/SPEC.md.)
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
// North-American phone shapes: (555) 123-4567 / 555-123-4567 / 5551234567 / +1 555 123 4567
const PHONE = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/;
const URL_RE = /\b(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|io|co)\b/i;
const CONTACT_PHRASE = /(contact us at|call us at|email us|reach us at|give us a call at|text us at)/i;

export function findContactInfo(reply: string): string | null {
  if (EMAIL.test(reply)) return "contains an email address";
  if (PHONE.test(reply)) return "contains a phone number";
  if (URL_RE.test(reply)) return "contains a URL";
  if (CONTACT_PHRASE.test(reply)) return "contains a contact phrase";
  return null;
}
