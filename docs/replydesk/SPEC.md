# ReplyDesk — Product Spec (approved 2026-07-10)

ReplyDesk is the software behind FiveStar Local's $29/mo Growth plan: an internal
console where the two founders manage Google-review replies for customers.

## Who uses it
The two founders only (v1). Built multi-tenant (per-business rows) so it can
become customer-facing later. Access: one shared passcode.

## Core loops
1. **Knowledgebase builder** — per business, three input methods, all producing
   editable markdown stored on the business row:
   - Website URL → server fetches the page → model distills → structured KB
   - Pasted raw info → same distillation
   - Pasted past review replies → a separate *voice profile* (tone, length,
     sign-off, recurring phrases)
2. **Reply generation** — paste a review + star rating → the model returns
   `{ reply, detail_referenced }` → code-level quality gates run → founder
   copies the reply into Google as profile manager → review marked `posted`.

## Quality gates (code, not model — cannot be prompt-injected away)
- HARD: no emails, phone numbers, URLs, or "contact us at" phrases in a reply.
- SOFT (triggers regenerate, max 2 retries, then flags for human):
  trigram-Dice similarity > 0.60 vs that business's last 10 posted replies.
- SOFT (flags for human): rating ≤ 3 and reply > 45 words.

## Reply rules (baked into the system prompt)
- Reference exactly one specific detail from the customer's review.
- Vary structure; never echo recent replies' shape.
- Weave in at most ONE signature-language phrase or the neighborhood name,
  and only when it fits naturally (local SEO without keyword stuffing).
- Negative (≤3★): short, one non-defensive apology, move resolution offline
  WITHOUT posting contact info — referencing the KB's real make-it-right
  action ("When Something Goes Wrong") when one exists.
- Sound like the owner (voice profile), never corporate, never "Thank you for
  your review" openers, no emojis unless the voice profile uses them.

## Out of scope v1
Customer logins, billing, auto-posting (blocked on Google Business Profile API
approval — see GBP-API.md), monthly reports (data is logged for it), mobile.

## Cost & model
All calls route through OpenRouter on one key. One model per task: reply
generation (openai/gpt-4.1-mini), knowledgebase building (deepseek/deepseek-v4-pro),
voice extraction (google/gemini-2.5-pro) — see DECISIONS.md 2026-07-13. At
expected volume (≤1,000 replies/mo) total API cost is well under the original
Claude-Opus-only estimate of $10–15/mo.
