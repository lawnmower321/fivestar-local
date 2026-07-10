// HARD gate: a public review reply must never contain direct contact info.
// (Google moderation + our own policy — see docs/replydesk/SPEC.md.)
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
// North-American phone shapes: (555) 123-4567 / 555-123-4567 / 5551234567 / +1 555 123 4567
const PHONE = /(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/;
// International groupings: a leading + country code then >=2 digit groups,
// e.g. +44 20 7946 0958 / +33 1 70 18 99 00. The literal + keeps this from
// tripping on dates/counts (natural prose almost never has a leading +).
const INTL_PHONE = /\+\d{1,3}(?:[\s.-]?\d{1,4}){2,}/;
// URLs and bare domains. First branch: explicit http(s):// or www. links.
// Second branch: a bare domain "label.tld" (optionally a multi-part TLD like
// co.uk) for ANY 2+ letter TLD — not just .com/.net/.org/.io/.co. Requiring
// the TLD letters immediately after the dot (no space) keeps normal sentence
// punctuation ("great. Our table…", "9 p.m.") from matching.
const URL_RE = /\b(?:https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.[a-z]{2,}(?:\.[a-z]{2,})?\b/i;
const CONTACT_PHRASE =
  /(contact us at|call us at|email us|reach us at|give us a call at|text us at|dm us|message us|find us online|our site|our website)/i;

export function findContactInfo(reply: string): string | null {
  if (EMAIL.test(reply)) return "contains an email address";
  if (PHONE.test(reply) || INTL_PHONE.test(reply)) return "contains a phone number";
  if (URL_RE.test(reply)) return "contains a URL";
  if (CONTACT_PHRASE.test(reply)) return "contains a contact phrase";
  return null;
}
