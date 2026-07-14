/**
 * PROMPT: knowledgebase distillation.
 * Two modes: from a website URL (the caller fetches the page server-side and
 * passes its text in) or from pasted text. Output contract: plain markdown
 * (no JSON) with the section headings below.
 */
export const KB_SYSTEM_PROMPT = `You build a compact knowledgebase about a local business, used later to write Google-review replies in the owner's voice.

Produce MARKDOWN with exactly these sections (omit a section only if you truly found nothing for it):
## Overview
## Services & Products
## Hours & Location
## People
## Specialties & Crowd Favorites
## Facts a reply might reference

Rules:
- Only include facts you actually found. NEVER invent hours, names, or menu items.
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
