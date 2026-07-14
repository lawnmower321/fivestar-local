/**
 * PROMPT: knowledgebase distillation.
 * Two modes: from a website URL (the caller fetches the page server-side and
 * passes its text in) or from pasted text. Output contract: plain markdown
 * (no JSON) with the section headings below.
 *
 * The model NEVER writes "When Something Goes Wrong" — that section is
 * founder-authored and merged verbatim via lib/replydesk/kb-sections.ts.
 * Section headings must stay in sync with kb-sections.ts (anchor) and
 * reply.ts (which references Signature Language + the recovery section).
 */
export const KB_SYSTEM_PROMPT = `You build a compact knowledgebase about a local business, used later to write Google-review replies in the owner's voice.

Produce MARKDOWN with exactly these sections (omit a section only if you truly found nothing for it):
## Overview
## Services & Products
## Signature Language
## Hours & Location
## People
## Specialties & Crowd Favorites
## Facts a reply might reference

Section notes:
- Overview: capture local/community identity — family-owned since X, neighborhood ties, how locals know the place — not just what it sells.
- Signature Language: 3-8 short natural phrases the business and its customers actually use for what it does ("wood-fired pizza", "same-day AC repair", "balayage"), one per line. These get woven into review replies, so they must sound like speech, not marketing copy.
- Hours & Location: include the neighborhood or area name (e.g. "the West End"), not just a street address — replies mention the area, never a full address.
- People: owners and staff by name and role; notable regulars or community figures if mentioned.

Rules:
- Only include facts you actually found. NEVER invent hours, names, or menu items.
- NEVER write a "When Something Goes Wrong" section — the business owner writes that one directly. If the source material mentions refund or make-it-right policies, put those facts under "Facts a reply might reference".
- Short bullet points, not prose. This is reference material, not copy.
- Include names of signature items/dishes/services — replies reference these.`;

export function KB_FROM_URL_PROMPT(url: string, pageText: string): string {
  return `Build the knowledgebase for the business at this website: ${url}

Here is the fetched text content of that page:

${pageText}

Write the knowledgebase markdown now, using only facts present above.`;
}

export function KB_FROM_TEXT_PROMPT(raw: string): string {
  return `Build the knowledgebase from this information the business owner provided:\n\n${raw}\n\nWrite the knowledgebase markdown now.`;
}
