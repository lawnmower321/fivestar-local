# Knowledgebase Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the per-business knowledgebase from a generic 6-section profile to an 8-section schema that captures signature language, neighborhood identity, and a founder-authored service-recovery policy — and make the reply prompt actually use them.

**Architecture:** The KB stays a single `kb_md` markdown column; the two new sections are markdown sections, not schema changes. A new pure module `lib/replydesk/kb-sections.ts` handles section merge/extract so the founder's verbatim recovery policy survives KB rebuilds. Prompt changes land in `kb.ts` and `reply.ts`; the only UI change is a fourth tab in `kb-builder.tsx`.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Vitest, Tailwind. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-07-13-kb-prompt-redesign-design.md`

## Global Constraints

- NO database migration, NO new server action, NO gate changes, NO change to the generateReply JSON contract.
- `lib/replydesk/` never imports from `next/*` (see `lib/replydesk/CLAUDE.md`).
- Prompt text changes are code changes: tested in `tests/replydesk/prompts.test.ts`, and `reply.ts` rules must move in the SAME commit as `docs/replydesk/SPEC.md` (see `lib/replydesk/ai/prompts/CLAUDE.md`).
- The recovery section title is exactly `When Something Goes Wrong`; the insertion anchor is exactly `Facts a reply might reference` (must match `KB_SYSTEM_PROMPT` headings, case-sensitive).
- NEVER `git add` these files — they are unrelated uncommitted marketing work sharing this tree: `.gitignore`, `.mcp.json`, `app/page.tsx`, `components/site/*`, `lib/content.ts`. Stage files by exact path only; never `git add -A` or `git add .`.
- Run tests with `npm test` (vitest run). Type-check with `npx tsc --noEmit`.

---

### Task 1: kb-sections helper module

**Files:**
- Create: `lib/replydesk/kb-sections.ts`
- Test: `tests/replydesk/kb-sections.test.ts`

**Interfaces:**
- Consumes: nothing (pure strings).
- Produces (Task 4 imports all three):
  - `RECOVERY_SECTION: string` — the constant `"When Something Goes Wrong"`.
  - `upsertKbSection(kbMd: string, sectionTitle: string, body: string): string`
  - `extractKbSection(kbMd: string, sectionTitle: string): string | null`

- [ ] **Step 1: Write the failing tests**

Create `tests/replydesk/kb-sections.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  upsertKbSection,
  extractKbSection,
  RECOVERY_SECTION,
} from "@/lib/replydesk/kb-sections";

const KB = `## Overview
Family-owned pizzeria in the West End.

## Specialties & Crowd Favorites
- garlic knots

## Facts a reply might reference
- opened 1997`;

describe("extractKbSection", () => {
  it("returns a section body without its heading", () => {
    expect(extractKbSection(KB, "Overview")).toBe(
      "Family-owned pizzeria in the West End.",
    );
  });

  it("returns null when the section is absent", () => {
    expect(extractKbSection(KB, RECOVERY_SECTION)).toBeNull();
  });
});

describe("upsertKbSection", () => {
  it("inserts a new section before the Facts anchor", () => {
    const out = upsertKbSection(KB, RECOVERY_SECTION, "We remake it on the spot.");
    const recoveryAt = out.indexOf("## When Something Goes Wrong");
    const factsAt = out.indexOf("## Facts a reply might reference");
    expect(recoveryAt).toBeGreaterThan(-1);
    expect(factsAt).toBeGreaterThan(recoveryAt);
    expect(extractKbSection(out, RECOVERY_SECTION)).toBe("We remake it on the spot.");
    // other sections untouched
    expect(extractKbSection(out, "Overview")).toBe(
      "Family-owned pizzeria in the West End.",
    );
    expect(extractKbSection(out, "Specialties & Crowd Favorites")).toBe(
      "- garlic knots",
    );
  });

  it("appends at the end when the anchor is missing", () => {
    const noAnchor = "## Overview\nJust a shop.";
    const out = upsertKbSection(noAnchor, RECOVERY_SECTION, "Full refund, no questions.");
    expect(out.trimEnd().endsWith("Full refund, no questions.")).toBe(true);
    expect(extractKbSection(out, "Overview")).toBe("Just a shop.");
  });

  it("replaces an existing section in place", () => {
    const withPolicy = upsertKbSection(KB, RECOVERY_SECTION, "Old policy.");
    const out = upsertKbSection(withPolicy, RECOVERY_SECTION, "New policy.");
    expect(extractKbSection(out, RECOVERY_SECTION)).toBe("New policy.");
    expect(out.match(/## When Something Goes Wrong/g)).toHaveLength(1);
  });

  it("is idempotent", () => {
    const once = upsertKbSection(KB, RECOVERY_SECTION, "We remake it.");
    const twice = upsertKbSection(once, RECOVERY_SECTION, "We remake it.");
    expect(twice).toBe(once);
  });

  it("round-trips extract→upsert across a simulated rebuild", () => {
    // Founder saved a policy…
    const saved = upsertKbSection(KB, RECOVERY_SECTION, "Tony re-inspects within 48h.");
    // …then rebuilds the KB from a URL; the model never emits the section.
    const rebuilt = `## Overview
New scrape of the site.

## Facts a reply might reference
- new fact`;
    const policy = extractKbSection(saved, RECOVERY_SECTION);
    const merged = policy
      ? upsertKbSection(rebuilt, RECOVERY_SECTION, policy)
      : rebuilt;
    expect(extractKbSection(merged, RECOVERY_SECTION)).toBe(
      "Tony re-inspects within 48h.",
    );
    expect(extractKbSection(merged, "Overview")).toBe("New scrape of the site.");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/replydesk/kb-sections.test.ts`
Expected: FAIL — cannot resolve `@/lib/replydesk/kb-sections`.

- [ ] **Step 3: Write the implementation**

Create `lib/replydesk/kb-sections.ts`:

```ts
// Pure markdown-section helpers for the knowledgebase. No I/O, no next/*.
// The KB is one markdown string; "## " headings delimit sections. The
// founder-authored recovery section is merged/preserved with these, never
// generated by the model (see ai/prompts/kb.ts).

export const RECOVERY_SECTION = "When Something Goes Wrong";

// Insertion anchor for new sections: the KB's catch-all final section.
const ANCHOR_SECTION = "Facts a reply might reference";

type Section = { title: string | null; body: string };

/** Split markdown into a preamble (title: null) plus one entry per "## " heading. */
function splitSections(kbMd: string): Section[] {
  const sections: Section[] = [];
  let current: Section = { title: null, body: "" };
  for (const line of kbMd.split("\n")) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      sections.push(current);
      current = { title: m[1], body: "" };
    } else {
      current.body += (current.body ? "\n" : "") + line;
    }
  }
  sections.push(current);
  return sections;
}

function render(sections: Section[]): string {
  return sections
    .filter((s) => s.title !== null || s.body.trim() !== "")
    .map((s) => {
      if (s.title === null) return s.body.trim();
      const body = s.body.trim();
      return body ? `## ${s.title}\n${body}` : `## ${s.title}`;
    })
    .join("\n\n");
}

/** Return a section's body (without its heading), or null if absent. */
export function extractKbSection(kbMd: string, sectionTitle: string): string | null {
  const hit = splitSections(kbMd).find((s) => s.title === sectionTitle);
  return hit ? hit.body.trim() : null;
}

/**
 * Replace the named section, or insert it before the "Facts a reply might
 * reference" anchor (append at end if the anchor is missing). Idempotent.
 */
export function upsertKbSection(
  kbMd: string,
  sectionTitle: string,
  body: string,
): string {
  const sections = splitSections(kbMd);
  const updated: Section = { title: sectionTitle, body: body.trim() };
  const i = sections.findIndex((s) => s.title === sectionTitle);
  if (i >= 0) {
    sections[i] = updated;
  } else {
    const anchor = sections.findIndex((s) => s.title === ANCHOR_SECTION);
    if (anchor >= 0) sections.splice(anchor, 0, updated);
    else sections.push(updated);
  }
  return render(sections);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/replydesk/kb-sections.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Update lib/replydesk/CLAUDE.md MAP**

In `lib/replydesk/CLAUDE.md`, add one MAP line after the `auth.ts` entry:

```
- kb-sections.ts — pure markdown-section merge/extract (founder-authored
  recovery section survives KB rebuilds)
```

- [ ] **Step 6: Commit**

```bash
git add lib/replydesk/kb-sections.ts tests/replydesk/kb-sections.test.ts lib/replydesk/CLAUDE.md
git commit -m "feat(replydesk): kb-sections helpers — upsert/extract markdown sections"
```

---

### Task 2: KB system prompt — 8-section schema

**Files:**
- Modify: `lib/replydesk/ai/prompts/kb.ts` (the `KB_SYSTEM_PROMPT` constant and the file header comment)
- Test: `tests/replydesk/prompts.test.ts` (append a new describe block)

**Interfaces:**
- Consumes: nothing.
- Produces: `KB_SYSTEM_PROMPT` (same export name; only the string changes). Section headings emitted by the model must match Task 1's anchor exactly: `## Facts a reply might reference`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/replydesk/prompts.test.ts`:

```ts
import { KB_SYSTEM_PROMPT } from "@/lib/replydesk/ai/prompts/kb";

describe("kb prompt", () => {
  it("names every model-produced section", () => {
    for (const heading of [
      "## Overview",
      "## Services & Products",
      "## Signature Language",
      "## Hours & Location",
      "## People",
      "## Specialties & Crowd Favorites",
      "## Facts a reply might reference",
    ]) {
      expect(KB_SYSTEM_PROMPT).toContain(heading);
    }
  });

  it("forbids the model from writing the recovery section", () => {
    expect(KB_SYSTEM_PROMPT).toMatch(/NEVER write a "When Something Goes Wrong" section/);
  });

  it("keeps the never-invent rule", () => {
    expect(KB_SYSTEM_PROMPT).toMatch(/NEVER invent/);
  });

  it("asks for neighborhood identity and natural phrases", () => {
    expect(KB_SYSTEM_PROMPT).toMatch(/neighborhood/i);
    expect(KB_SYSTEM_PROMPT).toMatch(/sound like speech, not marketing copy/i);
  });
});
```

(The existing `import { describe, it, expect } from "vitest";` at the top of the file already covers the new block.)

- [ ] **Step 2: Run tests to verify the new block fails**

Run: `npx vitest run tests/replydesk/prompts.test.ts`
Expected: the 3 existing reply-prompt tests PASS; the 4 new kb-prompt tests FAIL (missing headings/rules).

- [ ] **Step 3: Replace KB_SYSTEM_PROMPT**

In `lib/replydesk/ai/prompts/kb.ts`, replace the header comment and `KB_SYSTEM_PROMPT` with:

```ts
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
```

(`KB_FROM_URL_PROMPT` and `KB_FROM_TEXT_PROMPT` are unchanged.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/replydesk/prompts.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/replydesk/ai/prompts/kb.ts tests/replydesk/prompts.test.ts
git commit -m "feat(replydesk): 8-section KB schema — signature language, local identity, founder-only recovery"
```

---

### Task 3: Reply prompt rules + SPEC sync (one commit)

**Files:**
- Modify: `lib/replydesk/ai/prompts/reply.ts` (append rules 8-9 to `REPLY_SYSTEM_PROMPT`)
- Modify: `docs/replydesk/SPEC.md` ("Reply rules" section) — SAME commit (invariant in `lib/replydesk/ai/prompts/CLAUDE.md`)
- Test: `tests/replydesk/prompts.test.ts` (extend the existing "reply prompts" describe block)

**Interfaces:**
- Consumes: KB section titles from Task 2 (`Signature Language`, `When Something Goes Wrong`) — referenced by name inside the prompt text.
- Produces: `REPLY_SYSTEM_PROMPT` (same export; string gains rules 8-9). `buildReplyUserPrompt` unchanged. The generateReply JSON contract unchanged.

- [ ] **Step 1: Write the failing tests**

Add inside the existing `describe("reply prompts", ...)` block in `tests/replydesk/prompts.test.ts`:

```ts
  it("caps signature language at one phrase", () => {
    expect(REPLY_SYSTEM_PROMPT).toMatch(/Signature Language/);
    expect(REPLY_SYSTEM_PROMPT).toMatch(/AT MOST ONE/);
    expect(REPLY_SYSTEM_PROMPT).toMatch(/reads like marketing copy is a failed reply/i);
  });

  it("directs negative replies to the real recovery action", () => {
    expect(REPLY_SYSTEM_PROMPT).toMatch(/"When Something Goes Wrong"/);
    expect(REPLY_SYSTEM_PROMPT).toMatch(/never as contact info/i);
  });
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npx vitest run tests/replydesk/prompts.test.ts`
Expected: the 2 new tests FAIL; all others PASS.

- [ ] **Step 3: Append rules 8-9 to REPLY_SYSTEM_PROMPT**

In `lib/replydesk/ai/prompts/reply.ts`, insert after rule 7 (before the blank line and `Return JSON…`):

```
8. If the knowledgebase has a "Signature Language" section or names the neighborhood, you may weave in AT MOST ONE such phrase — and only where it fits the sentence naturally. If it would sound forced, use none. Never more than one: a reply that reads like marketing copy is a failed reply.
9. For reviews rated 3 stars or lower, if the knowledgebase has a "When Something Goes Wrong" section: your invitation back must reference that real action (e.g. "we'll remake it on the spot"), phrased as something you will DO — never as contact info. If that section is absent, keep the invitation generic.
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/replydesk/prompts.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Update SPEC.md "Reply rules" in the same working set**

In `docs/replydesk/SPEC.md`, replace the "Reply rules (baked into the system prompt)" section body with:

```markdown
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
```

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: all tests PASS (existing 31 + 7 kb-sections + 6 new prompt tests = 44).

- [ ] **Step 7: Commit (reply.ts and SPEC.md together)**

```bash
git add lib/replydesk/ai/prompts/reply.ts docs/replydesk/SPEC.md tests/replydesk/prompts.test.ts
git commit -m "feat(replydesk): reply rules — one signature phrase max, real recovery action on negatives"
```

---

### Task 4: KB-builder UI — Make-it-right tab + rebuild preservation

**Files:**
- Modify: `components/admin/kb-builder.tsx`
- Modify: `components/admin/CLAUDE.md` (MAP entry)
- Modify: `docs/replydesk/SPEC.md` (core-loop input methods line)
- Test: none new (client component; the merge logic it calls is fully covered by Task 1). Verification is tsc + lint + build + full suite.

**Interfaces:**
- Consumes (from Task 1): `import { upsertKbSection, extractKbSection, RECOVERY_SECTION } from "@/lib/replydesk/kb-sections";` — a pure module, safe in a client component (no `next/*`, no server-only code).
- Produces: UI only; saving still goes through the existing `saveKbAction`.

- [ ] **Step 1: Add the import, tab type, and state to kb-builder.tsx**

```tsx
import { upsertKbSection, extractKbSection, RECOVERY_SECTION } from "@/lib/replydesk/kb-sections";
```

Change the Tab type:

```tsx
type Tab = "url" | "paste" | "voice" | "recovery";
```

Add state after the `pastReplies` state line — prefilled so an existing policy is editable, not blind-overwritten:

```tsx
const [recovery, setRecovery] = useState(
  () => extractKbSection(business.kbMd, RECOVERY_SECTION) ?? "",
);
```

- [ ] **Step 2: Add the fourth tab button**

After the voice tab button:

```tsx
<button className={tabClass("recovery")} onClick={() => setTab("recovery")}>Make-it-right policy</button>
```

- [ ] **Step 3: Add the recovery panel**

After the `{tab === "voice" && (...)}` block:

```tsx
{tab === "recovery" && (
  <div className="mt-4 space-y-2">
    <label className="block text-sm font-medium text-slate-700">
      When something goes wrong, how do you make it right?
    </label>
    <p className="text-xs text-slate-500">
      Your own words, saved verbatim — negative-review replies will offer this
      real action instead of a generic apology. Phone numbers/emails are
      stripped by the contact-info gate, so describe the action, not a number.
    </p>
    <textarea value={recovery} onChange={(e) => setRecovery(e.target.value)} rows={3}
      placeholder="e.g. We remake the dish on the spot, no questions. For jobs, Tony re-inspects within 48h."
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
    <button disabled={pending || !recovery.trim()}
      onClick={() => {
        setKb(upsertKbSection(kb, RECOVERY_SECTION, recovery));
        setStatus("Policy added to the KB below — click Save KB to store it.");
      }}
      className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50">
      Add to KB
    </button>
  </div>
)}
```

(Synchronous — no server action, so no `run()` wrapper; `setStatus` doubles as the success hint.)

- [ ] **Step 4: Preserve the recovery section across rebuilds**

Replace the url-tab button `onClick` body:

```tsx
onClick={() => run(async () => {
  const built = await buildKbFromUrlAction(business.id, url);
  const policy = extractKbSection(kb, RECOVERY_SECTION);
  setKb(policy ? upsertKbSection(built, RECOVERY_SECTION, policy) : built);
}))
```

Replace the paste-tab button `onClick` body:

```tsx
onClick={() => run(async () => {
  const built = await buildKbFromTextAction(business.id, raw);
  const policy = extractKbSection(kb, RECOVERY_SECTION);
  setKb(policy ? upsertKbSection(built, RECOVERY_SECTION, policy) : built);
}))
```

(The KB model is forbidden from emitting the recovery section, so without this
merge every rebuild would silently wipe the founder's policy.)

- [ ] **Step 5: Update docs**

`components/admin/CLAUDE.md` — replace the kb-builder MAP line with:

```
- kb-builder.tsx — 4-tab KB builder (URL / pasted info / voice from past
  replies / make-it-right policy) + editable KB & voice textareas with
  explicit Save. The policy tab merges founder text verbatim via
  lib/replydesk/kb-sections.ts; URL/paste rebuilds re-merge the existing
  policy so it survives (the KB model never emits that section).
```

`docs/replydesk/SPEC.md` — in "Core loops" item 1, change "three input methods" to "four input methods" and add a fourth bullet after the voice-profile bullet:

```markdown
   - Typed make-it-right policy → merged verbatim as "When Something Goes
     Wrong" (never AI-generated; survives KB rebuilds)
```

- [ ] **Step 6: Verify everything**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

Expected: tsc silent; lint clean; 44 tests pass; build succeeds with `/admin`, `/admin/login`, `/admin/businesses/[id]` routes present.

- [ ] **Step 7: Commit**

```bash
git add components/admin/kb-builder.tsx components/admin/CLAUDE.md docs/replydesk/SPEC.md
git commit -m "feat(replydesk): make-it-right policy tab; recovery section survives KB rebuilds"
```

---

### Task 5: Decision log + handoff sync

**Files:**
- Modify: `docs/replydesk/DECISIONS.md` (append-only entry)
- Modify: `docs/replydesk/HANDOFF.md` (feature description mentions the 8-section KB)

**Interfaces:** none — documentation only.

- [ ] **Step 1: Append the decision entry**

Append to `docs/replydesk/DECISIONS.md` (never edit old entries):

```markdown
## 2026-07-13 — KB redesigned to 8 sections; recovery policy is founder-only
Research-driven: replies referencing real specifics beat templates (72% of
consumers distrust AI-sounding replies); review responses are crawled, so ONE
naturally-woven service/location phrase is a local-SEO lever (stuffing is
penalized); negative replies should offer the business's real make-it-right
action. New sections: "Signature Language" (model-sourced) and "When Something
Goes Wrong" (founder-authored, merged verbatim by lib/replydesk/kb-sections.ts,
NEVER model-generated — the KB prompt forbids it and URL/paste rebuilds
re-merge it so it survives). Reply prompt: at most ONE signature/neighborhood
phrase per reply; negatives reference the real recovery action, phrased as an
action, never contact info (hard gate still enforces). No DB migration — the
KB stays one markdown column. Spec:
docs/superpowers/specs/2026-07-13-kb-prompt-redesign-design.md.
```

- [ ] **Step 2: Update HANDOFF.md**

In `docs/replydesk/HANDOFF.md`, under "### Feature", replace the paragraph with:

```markdown
ReplyDesk: a passcode-protected `/admin` console where founders build a
per-customer knowledgebase (8 sections incl. founder-authored make-it-right
policy + signature language) and generate on-brand Google-review replies that
pass code-level anti-moderation quality gates.
```

- [ ] **Step 3: Commit**

```bash
git add docs/replydesk/DECISIONS.md docs/replydesk/HANDOFF.md
git commit -m "docs(replydesk): log KB-redesign decision, sync handoff"
```
