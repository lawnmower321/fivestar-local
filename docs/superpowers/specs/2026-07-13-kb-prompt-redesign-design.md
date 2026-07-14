# Knowledgebase Redesign — Design (approved 2026-07-13)

Make the per-business knowledgebase capture what actually makes review replies
feel human and drive value, instead of a generic business profile. Research
basis: replies that reference real specifics beat "professional" templates
(72% of consumers lose trust in AI-sounding replies); review responses are
crawled by Google, so natural service+location language is a documented local
SEO lever (stuffing is penalized); best-practice negative replies offer a real
recovery action, not a generic apology.

## Scope

- Rewrite `KB_SYSTEM_PROMPT` (lib/replydesk/ai/prompts/kb.ts) to the new
  8-section schema below.
- Update `REPLY_SYSTEM_PROMPT` (lib/replydesk/ai/prompts/reply.ts) so replies
  actually use the new sections (three rules below).
- New pure helper `upsertKbSection` (lib/replydesk/kb-sections.ts).
- New "recovery policy" input in components/admin/kb-builder.tsx.
- SPEC.md reply rules updated in the same commit (prompt/SPEC sync invariant).
- NO database migration, NO new server action, NO gate changes, NO change to
  the generateReply JSON contract.

## KB schema (8 sections, up from 6)

```
## Overview                       kept — now explicitly asks for local/community
                                  identity (family-owned since X, neighborhood
                                  ties), not just a services blurb
## Services & Products            kept
## Signature Language             NEW — natural phrases the business/customers
                                  use ("wood-fired pizza", "same-day AC repair");
                                  model-sourced like the rest of the KB
## Hours & Location               kept — must capture neighborhood/area name,
                                  not just a street address
## People                         kept — also covers regulars/community figures
## Specialties & Crowd Favorites  kept
## When Something Goes Wrong      NEW — the real service-recovery action.
                                  FOUNDER-AUTHORED ONLY, inserted verbatim; the
                                  KB model must OMIT this section, never infer it
## Facts a reply might reference  kept, catch-all
```

Fuller-redesign items folded in rather than added as sections: brand story →
Overview, SEO keyword list → Signature Language, regulars → People. A
"common objections/FAQs" section was deliberately dropped — review replies
never answer FAQs, so it would be dead weight at reply time.

## Data flow

KB stays one `kb_md` text column. The recovery policy is a markdown section,
not a column.

`upsertKbSection(kbMd, sectionTitle, body): string`
- Pure string function, no I/O, lives in lib/replydesk/kb-sections.ts.
- Replaces the named `##` section if present; otherwise inserts it before
  "## Facts a reply might reference" (appends at end if that anchor is
  missing). Idempotent.

kb-builder.tsx adds a fourth input: labeled textarea "When something goes
wrong, how do you make it right?" with helper text (e.g. "We remake the dish
on the spot, no questions. For jobs, Tony re-inspects within 48h."). Its
button merges the text into the KB textarea via `upsertKbSection`; saving
still goes through the existing `saveKbAction`. Empty input disables the
button. No LLM call — zero hallucination risk, zero added cost, and the
founder's own wording is the authentic voice.

## Reply prompt rules (reply.ts)

1. Signature language, capped at ONE: when it fits naturally, include at most
   one phrase from Signature Language or the neighborhood/area name; none if
   forced. Never more than one (anti-keyword-stuffing; Google penalizes
   stuffed replies).
2. Real recovery on negatives (≤3★): if the KB has "When Something Goes
   Wrong", the invitation back must reference that real action, paraphrased
   as an ACTION, never as contact info. Absent the section, today's generic
   behavior stands.
3. SPEC.md "Reply rules" updated in the same commit.

The contact-info hard gate remains the enforcement backstop — if the model
quotes a phone/email out of the founder's policy text, the gate kills it.

## Error handling

No new failure modes: the merge is a string operation. The existing
build/extract error paths (fetch guard, empty-response throws) are untouched.

## Testing

- NEW tests/replydesk/kb-sections.test.ts: appends when absent, replaces when
  present, preserves other sections, stable ordering, idempotency.
- EXTENDED tests/replydesk/prompts.test.ts: KB system prompt names all 8
  sections and forbids inventing the recovery section; reply system prompt
  contains the one-phrase cap and the recovery-action rule.
- All existing tests stay green (gates and generate-reply unaffected; the
  JSON output contract does not change).

## Out of scope

Multi-page site crawling, KB refresh automation, per-section DB columns,
reply-length/gate changes, voice-profile changes.
