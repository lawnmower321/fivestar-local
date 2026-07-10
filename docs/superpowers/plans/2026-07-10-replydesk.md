# ReplyDesk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ReplyDesk — a passcode-protected `/admin` console inside the fivestar-local Next.js app where the FiveStar Local founders build a per-customer knowledgebase (from a website URL, pasted info, or past review replies) and generate on-brand Google-review replies that pass code-level anti-moderation quality gates.

**Architecture:** All business logic lives in pure, dependency-injected functions under `lib/replydesk/` (testable without network). Next.js server actions are thin wrappers that call those functions. Data lives in Supabase (two tables, service-role key server-side only). AI calls use the Anthropic SDK with `claude-opus-4-8` and structured outputs. The repo follows the **Interpretable Context Methodology** (§ below): every module folder is a self-describing unit with its own `CLAUDE.md`, so any future agent can load one folder and work safely.

**Tech Stack:** Next.js 16 (App Router, already in repo) · Tailwind v4 + shadcn/Base UI (already in repo) · Supabase (`@supabase/supabase-js`) · Anthropic SDK (`@anthropic-ai/sdk`) · Vitest.

## Global Constraints

- **Model:** exactly `claude-opus-4-8` for every AI call. Never a date-suffixed variant.
- **Never send `temperature`, `top_p`, `top_k`, or `thinking: {type:"enabled", budget_tokens}`** — these 400 on this model family. Omit `thinking` entirely or use `{type: "adaptive"}`.
- **Structured outputs** use `output_config: { format: { type: "json_schema", schema } }` — never the deprecated top-level `output_format`.
- **Secrets stay server-side.** `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` must never be imported into a client component or prefixed `NEXT_PUBLIC_`.
- **This is NOT the Next.js you know** (per repo `AGENTS.md`): before using any Next API you haven't used in this repo yet (`cookies()`, `redirect()`, segment config, server actions), read the relevant guide in `node_modules/next/dist/docs/`. Note: `cookies()` is async in this version — `await cookies()`.
- **UI matches the existing site:** Tailwind utilities, `font-heading` for headings, `gblue`/`ggreen`/`gred`/`gyellow` accent classes, the existing `Button` from `components/ui/button` (Base UI: `render={<a/>}` + `nativeButton={false}` for link-buttons).
- **Every module folder created by this plan gets a `CLAUDE.md`** per the Interpretable Context Methodology below, written in the same task that creates the folder — not deferred.
- **Commit after every task** (message style: `feat(replydesk): ...`). Do not push unless the user asks.
- **All tests:** `npm test` (Vitest). Build check: `npm run build`. Both must pass at the end of every task.

---

## Interpretable Context Methodology: Folder Structure as Agentic Architecture

This build treats the folder tree itself as the primary context system for AI agents. The rules — the executing agent MUST follow these while building, and future agents rely on them:

1. **One module, one folder, one `CLAUDE.md`.** Every folder under `lib/replydesk/` and `app/admin/` contains a `CLAUDE.md` answering, in under ~40 lines: *What is this module? What are its invariants (things that must never change without a decision-log entry)? What does it depend on / what depends on it? Where are its tests?* An agent that reads one folder + its `CLAUDE.md` must be able to modify that folder safely without reading the rest of the repo.
2. **Names read as intent.** `gates/contact-info.ts`, not `utils/regex2.ts`. A directory listing should read like a table of contents of the system.
3. **Prompts are code, colocated and versioned.** Every LLM prompt lives in `lib/replydesk/ai/prompts/` as an exported constant in its own file, with a comment header stating what it's for, its input variables, and its output contract. Prompt changes are diffs, not mysteries.
4. **Decisions are append-only.** `docs/replydesk/DECISIONS.md` is an append-only log. Whenever the executing agent makes a judgment call not fully specified by this plan (or deviates from it), it appends one entry: date, decision, why. Never edit old entries.
5. **Pure core, thin shell.** Everything under `lib/replydesk/` is importable and testable in plain Node (no Next.js imports, no `use server`). External effects (Anthropic client, Supabase client) are injected as parameters. `app/admin/` is the thin shell: UI + server actions that wire the core to the web.
6. **Update context on change.** Any task that changes a module's behavior updates that module's `CLAUDE.md` in the same commit. A stale context file is a bug.

### Target folder tree (created across the tasks below)

```
fivestar-local/
├── docs/replydesk/
│   ├── SPEC.md                      # approved product spec (Task 0)
│   ├── DECISIONS.md                 # append-only decision log (Task 0)
│   └── GBP-API.md                   # Google Business Profile API application checklist (Task 0)
├── supabase/migrations/
│   └── 0001_replydesk.sql           # schema (Task 1)
├── lib/replydesk/
│   ├── CLAUDE.md
│   ├── types.ts                     # Business, Review, GateReport, GeneratedReply
│   ├── db.ts                        # Supabase client factory + typed queries
│   ├── auth.ts                      # passcode hash/verify helpers
│   ├── gates/
│   │   ├── CLAUDE.md
│   │   ├── contact-info.ts          # hard gate: emails/phones/URLs/contact phrases
│   │   ├── similarity.ts            # trigram Dice similarity vs recent replies
│   │   ├── length.ts                # ≤3★ replies capped at 45 words
│   │   └── index.ts                 # runGates() orchestrator
│   └── ai/
│       ├── CLAUDE.md
│       ├── client.ts                # Anthropic client factory
│       ├── generate-reply.ts        # reply generation + gate/retry loop
│       ├── build-knowledgebase.ts   # URL → KB (web_fetch tool) / text → KB
│       ├── extract-voice.ts         # past replies → voice profile
│       └── prompts/
│           ├── CLAUDE.md
│           ├── reply.ts             # system prompt + user-prompt builder
│           ├── kb.ts                # KB distillation prompts (url + text modes)
│           └── voice.ts             # voice-profile extraction prompt
├── app/admin/
│   ├── CLAUDE.md
│   ├── layout.tsx                   # auth guard + nav shell
│   ├── login/page.tsx               # passcode form
│   ├── actions.ts                   # all server actions
│   ├── page.tsx                     # business list + create
│   └── businesses/[id]/page.tsx     # KB builder + reply workspace
├── components/admin/                # client components for the workspace
│   ├── CLAUDE.md
│   ├── kb-builder.tsx
│   └── reply-workspace.tsx
└── tests/replydesk/
    ├── gates.test.ts
    ├── prompts.test.ts
    ├── generate-reply.test.ts
    └── auth.test.ts
```

---

### Task 0: Scaffolding, dependencies, and context docs

**Files:**
- Create: `docs/replydesk/SPEC.md`, `docs/replydesk/DECISIONS.md`, `docs/replydesk/GBP-API.md`
- Create: `lib/replydesk/CLAUDE.md`
- Create: `vitest.config.ts`
- Modify: `package.json` (deps + `test` script)
- Create: `.env.example`

**Interfaces:**
- Consumes: nothing.
- Produces: installed packages `@anthropic-ai/sdk`, `@supabase/supabase-js`, `vitest`; `npm test` runs Vitest; the docs tree every later task links to.

- [ ] **Step 1: Install dependencies**

```bash
npm install @anthropic-ai/sdk @supabase/supabase-js
npm install -D vitest
```

- [ ] **Step 2: Add test script and Vitest config**

In `package.json` `"scripts"`, add: `"test": "vitest run"`.

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 3: Verify the test runner works**

Run: `npm test`
Expected: Vitest exits reporting "No test files found" (non-zero exit is fine at this step; note `--passWithNoTests` is NOT added — real tests arrive in Task 2).

- [ ] **Step 4: Create `.env.example`**

```bash
# ReplyDesk — copy to .env.local and fill in. NEVER commit .env.local.
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service-role-key-here   # server-only, bypasses RLS
ANTHROPIC_API_KEY=sk-ant-...
REPLYDESK_PASSCODE=pick-a-long-passphrase
```

- [ ] **Step 5: Write `docs/replydesk/SPEC.md`**

```markdown
# ReplyDesk — Product Spec (approved 2026-07-10)

ReplyDesk is the software behind FiveStar Local's $29/mo Growth plan: an internal
console where the two founders manage Google-review replies for customers.

## Who uses it
The two founders only (v1). Built multi-tenant (per-business rows) so it can
become customer-facing later. Access: one shared passcode.

## Core loops
1. **Knowledgebase builder** — per business, three input methods, all producing
   editable markdown stored on the business row:
   - Website URL → Claude reads the site (web_fetch tool) → structured KB
   - Pasted raw info → same distillation
   - Pasted past review replies → a separate *voice profile* (tone, length,
     sign-off, recurring phrases)
2. **Reply generation** — paste a review + star rating → Claude returns
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
- Negative (≤3★): short, one non-defensive apology, move resolution offline
  WITHOUT posting contact info.
- Sound like the owner (voice profile), never corporate, never "Thank you for
  your review" openers, no emojis unless the voice profile uses them.

## Out of scope v1
Customer logins, billing, auto-posting (blocked on Google Business Profile API
approval — see GBP-API.md), monthly reports (data is logged for it), mobile.

## Cost & model
`claude-opus-4-8` everywhere. At expected volume (≤1,000 replies/mo) total API
cost ≈ $10–15/mo.
```

- [ ] **Step 6: Write `docs/replydesk/DECISIONS.md`**

```markdown
# ReplyDesk Decision Log (append-only)

Format: `## YYYY-MM-DD — <decision>` then 1–3 lines of why. Never edit old entries.

## 2026-07-10 — Internal console first, multi-tenant data model
Two founders are the only users until MRR justifies self-serve. Businesses are
rows, not tenants with auth, so the upgrade path is additive.

## 2026-07-10 — Copy-paste posting until GBP API approval
Programmatic posting requires Google Business Profile API access (application
submitted separately — see GBP-API.md). Everything else works without it.
```

- [ ] **Step 7: Write `docs/replydesk/GBP-API.md`**

```markdown
# Google Business Profile API — access application (HUMAN TASK)

Goal: programmatic review fetch + reply posting. Until approved, ReplyDesk is
paste-in / copy-out.

Checklist (founder does this in a browser; an agent cannot):
1. Create a Google Cloud project named `fivestar-local` (console.cloud.google.com).
2. Enable "Google My Business API" / "Business Profile Performance API".
3. Fill the GBP API access request form (search "Google Business Profile API
   access request"). Describe the business as: agency managing Google review
   engagement for local-business clients, with manager access to each client's
   profile. Use the hello@fivestarlocal.pro email.
4. Wait for approval email (days–weeks). Record the outcome here with a date.
5. When approved: file a new plan for `lib/replydesk/gbp/` (OAuth as manager,
   review polling, reply posting with per-business auto-post settings:
   auto-post 4–5★ that pass gates, queue ≤3★ for approval).

Status log:
- 2026-07-__ — application submitted (fill in when done)
```

- [ ] **Step 8: Write `lib/replydesk/CLAUDE.md`**

```markdown
# lib/replydesk — ReplyDesk core

Pure, dependency-injected business logic for ReplyDesk (see docs/replydesk/SPEC.md).

INVARIANTS
- Nothing in this tree imports from `next/*` or uses `use server`. Plain Node.
- External clients (Anthropic, Supabase) are constructed in `client.ts`/`db.ts`
  factories and INJECTED into logic functions, so tests pass fakes.
- Model is exactly `claude-opus-4-8`; no temperature/top_p/top_k/budget_tokens.
- Quality gates (gates/) run in code AFTER generation. AI output is never
  trusted to self-certify.

MAP
- types.ts — shared types (Business, Review, GateReport, GeneratedReply)
- db.ts — Supabase factory + typed queries (service-role key, server-only)
- auth.ts — passcode hashing/verification for the /admin cookie
- gates/ — reply quality gates (see gates/CLAUDE.md)
- ai/ — prompt builders + Anthropic callers (see ai/CLAUDE.md)

TESTS: tests/replydesk/
```

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts .env.example docs/replydesk lib/replydesk/CLAUDE.md
git commit -m "feat(replydesk): scaffold docs, deps, test runner, context files"
```

---

### Task 1: Types, database schema, and typed query layer

**Files:**
- Create: `supabase/migrations/0001_replydesk.sql`
- Create: `lib/replydesk/types.ts`
- Create: `lib/replydesk/db.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces (used by Tasks 4, 6, 7, 8):
  - Types: `Business { id, name, reviewUrl, kbMd, voiceMd, createdAt }`, `Review { id, businessId, rating, reviewer, reviewText, replyText, detailReferenced, similarity, flags, status, createdAt, postedAt }`
  - `getDb(): SupabaseClient` (reads env vars, throws if missing)
  - Queries (all take `db: SupabaseClient` as first arg): `listBusinesses(db)`, `getBusiness(db, id)`, `createBusiness(db, { name, reviewUrl })`, `updateBusiness(db, id, { kbMd?, voiceMd?, name?, reviewUrl? })`, `insertReview(db, review)`, `listReviews(db, businessId, limit?)`, `recentPostedReplies(db, businessId, limit?)` → `string[]`, `markPosted(db, reviewId)`

- [ ] **Step 1: Write the migration**

`supabase/migrations/0001_replydesk.sql`:

```sql
-- ReplyDesk schema. Run in Supabase SQL editor (or `supabase db push` if CLI linked).
create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  review_url text,
  kb_md text not null default '',
  voice_md text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  reviewer text,
  review_text text not null,
  reply_text text,
  detail_referenced text,
  similarity real,
  flags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','posted')),
  created_at timestamptz not null default now(),
  posted_at timestamptz
);

create index if not exists reviews_business_idx on reviews (business_id, created_at desc);

-- RLS on with no policies: anon/authenticated keys can read nothing.
-- The app uses the service-role key server-side, which bypasses RLS.
alter table businesses enable row level security;
alter table reviews enable row level security;
```

- [ ] **Step 2: Write `lib/replydesk/types.ts`**

```ts
export type Business = {
  id: string;
  name: string;
  reviewUrl: string | null;
  kbMd: string;
  voiceMd: string;
  createdAt: string;
};

export type ReviewStatus = "draft" | "posted";

export type Review = {
  id: string;
  businessId: string;
  rating: number;
  reviewer: string | null;
  reviewText: string;
  replyText: string | null;
  detailReferenced: string | null;
  similarity: number | null;
  flags: string[];
  status: ReviewStatus;
  createdAt: string;
  postedAt: string | null;
};

export type GateReport = {
  ok: boolean;            // false if any gate tripped
  hardFail: boolean;      // true only for contact-info (never show reply as ready)
  reasons: string[];      // human-readable, one per tripped gate
  similarity: number;     // max Dice similarity vs recent replies (0..1)
};

export type GeneratedReply = {
  reply: string;
  detailReferenced: string;
  gate: GateReport;
  attempts: number;       // 1..3
};
```

- [ ] **Step 3: Write `lib/replydesk/db.ts`**

```ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Business, Review } from "./types";

export function getDb(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToBusiness(r: any): Business {
  return {
    id: r.id, name: r.name, reviewUrl: r.review_url,
    kbMd: r.kb_md, voiceMd: r.voice_md, createdAt: r.created_at,
  };
}

function rowToReview(r: any): Review {
  return {
    id: r.id, businessId: r.business_id, rating: r.rating, reviewer: r.reviewer,
    reviewText: r.review_text, replyText: r.reply_text,
    detailReferenced: r.detail_referenced, similarity: r.similarity,
    flags: r.flags ?? [], status: r.status, createdAt: r.created_at, postedAt: r.posted_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function must<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error("not found");
  return data;
}

export async function listBusinesses(db: SupabaseClient): Promise<Business[]> {
  const { data, error } = await db.from("businesses").select("*").order("name");
  return must(data, error).map(rowToBusiness);
}

export async function getBusiness(db: SupabaseClient, id: string): Promise<Business> {
  const { data, error } = await db.from("businesses").select("*").eq("id", id).single();
  return rowToBusiness(must(data, error));
}

export async function createBusiness(
  db: SupabaseClient, input: { name: string; reviewUrl?: string | null },
): Promise<Business> {
  const { data, error } = await db.from("businesses")
    .insert({ name: input.name, review_url: input.reviewUrl ?? null })
    .select("*").single();
  return rowToBusiness(must(data, error));
}

export async function updateBusiness(
  db: SupabaseClient, id: string,
  patch: Partial<{ kbMd: string; voiceMd: string; name: string; reviewUrl: string | null }>,
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.kbMd !== undefined) row.kb_md = patch.kbMd;
  if (patch.voiceMd !== undefined) row.voice_md = patch.voiceMd;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.reviewUrl !== undefined) row.review_url = patch.reviewUrl;
  const { error } = await db.from("businesses").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertReview(
  db: SupabaseClient,
  r: { businessId: string; rating: number; reviewer: string | null; reviewText: string;
       replyText: string | null; detailReferenced: string | null; similarity: number | null;
       flags: string[] },
): Promise<Review> {
  const { data, error } = await db.from("reviews").insert({
    business_id: r.businessId, rating: r.rating, reviewer: r.reviewer,
    review_text: r.reviewText, reply_text: r.replyText,
    detail_referenced: r.detailReferenced, similarity: r.similarity, flags: r.flags,
  }).select("*").single();
  return rowToReview(must(data, error));
}

export async function listReviews(
  db: SupabaseClient, businessId: string, limit = 50,
): Promise<Review[]> {
  const { data, error } = await db.from("reviews").select("*")
    .eq("business_id", businessId).order("created_at", { ascending: false }).limit(limit);
  return must(data, error).map(rowToReview);
}

export async function recentPostedReplies(
  db: SupabaseClient, businessId: string, limit = 10,
): Promise<string[]> {
  const { data, error } = await db.from("reviews").select("reply_text")
    .eq("business_id", businessId).eq("status", "posted")
    .not("reply_text", "is", null)
    .order("posted_at", { ascending: false }).limit(limit);
  return must(data, error).map((r) => r.reply_text as string);
}

export async function markPosted(db: SupabaseClient, reviewId: string): Promise<void> {
  const { error } = await db.from("reviews")
    .update({ status: "posted", posted_at: new Date().toISOString() }).eq("id", reviewId);
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors (pre-existing repo errors, if any, noted in DECISIONS.md).

- [ ] **Step 5: Commit**

```bash
git add supabase lib/replydesk/types.ts lib/replydesk/db.ts
git commit -m "feat(replydesk): schema migration, types, typed query layer"
```

**HUMAN TASK (note in final report, don't block):** create a free Supabase project, run `supabase/migrations/0001_replydesk.sql` in its SQL editor, and put `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` into `.env.local` and the Vercel project env settings.

---

### Task 2: Quality gates (pure functions, full TDD)

**Files:**
- Create: `tests/replydesk/gates.test.ts`
- Create: `lib/replydesk/gates/contact-info.ts`
- Create: `lib/replydesk/gates/similarity.ts`
- Create: `lib/replydesk/gates/length.ts`
- Create: `lib/replydesk/gates/index.ts`
- Create: `lib/replydesk/gates/CLAUDE.md`

**Interfaces:**
- Consumes: `GateReport` from `lib/replydesk/types.ts` (Task 1).
- Produces (used by Task 4):
  - `findContactInfo(reply: string): string | null` — reason string or null
  - `diceSimilarity(a: string, b: string): number` and `maxSimilarity(candidate: string, corpus: string[]): number` (0..1)
  - `lengthViolation(reply: string, rating: number): string | null`
  - `runGates(reply: string, ctx: { rating: number; recentReplies: string[] }): GateReport`
  - Threshold constant: `SIMILARITY_THRESHOLD = 0.6`

- [ ] **Step 1: Write the failing tests**

`tests/replydesk/gates.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { findContactInfo } from "@/lib/replydesk/gates/contact-info";
import { diceSimilarity, maxSimilarity } from "@/lib/replydesk/gates/similarity";
import { lengthViolation } from "@/lib/replydesk/gates/length";
import { runGates, SIMILARITY_THRESHOLD } from "@/lib/replydesk/gates";

describe("contact-info gate", () => {
  it("flags emails", () => {
    expect(findContactInfo("Reach me at tony@tonyspizza.com anytime")).toContain("email");
  });
  it("flags phone numbers in common formats", () => {
    expect(findContactInfo("Call (555) 123-4567 and ask for Tony")).toContain("phone");
    expect(findContactInfo("Call 555-123-4567")).toContain("phone");
    expect(findContactInfo("Call 5551234567 today")).toContain("phone");
  });
  it("flags URLs", () => {
    expect(findContactInfo("See www.tonyspizza.com for deals")).toContain("URL");
    expect(findContactInfo("Visit https://tonyspizza.com")).toContain("URL");
  });
  it("flags contact phrases", () => {
    expect(findContactInfo("Please contact us at the shop")).toContain("contact phrase");
  });
  it("passes clean replies mentioning numbers that are not phones", () => {
    expect(findContactInfo("Thanks for visiting us on May 5, 2026 — the garlic knots are a team favorite!")).toBeNull();
    expect(findContactInfo("Glad the party of 12 had a great time!")).toBeNull();
  });
});

describe("similarity gate", () => {
  it("returns 1 for identical strings", () => {
    expect(diceSimilarity("thanks so much", "thanks so much")).toBeCloseTo(1, 5);
  });
  it("returns near 0 for unrelated strings", () => {
    expect(diceSimilarity("the pepperoni was amazing", "we fixed your brake pads")).toBeLessThan(0.3);
  });
  it("maxSimilarity picks the highest match in the corpus", () => {
    const corpus = ["totally different text", "thanks so much for the kind words"];
    expect(maxSimilarity("thanks so much for the kind words!", corpus)).toBeGreaterThan(0.8);
  });
  it("returns 0 for an empty corpus", () => {
    expect(maxSimilarity("anything", [])).toBe(0);
  });
});

describe("length gate", () => {
  const long = Array(50).fill("word").join(" ");
  it("flags long replies to negative reviews", () => {
    expect(lengthViolation(long, 2)).toContain("45 words");
  });
  it("allows long replies to positive reviews", () => {
    expect(lengthViolation(long, 5)).toBeNull();
  });
  it("allows short replies to negative reviews", () => {
    expect(lengthViolation("So sorry about the wait — please give us another chance.", 1)).toBeNull();
  });
});

describe("runGates", () => {
  it("hard-fails on contact info", () => {
    const r = runGates("Email tony@pizza.com", { rating: 5, recentReplies: [] });
    expect(r.ok).toBe(false);
    expect(r.hardFail).toBe(true);
  });
  it("soft-fails on high similarity", () => {
    const prev = "Thanks so much for the kind words about our garlic knots!";
    const r = runGates(prev, { rating: 5, recentReplies: [prev] });
    expect(r.ok).toBe(false);
    expect(r.hardFail).toBe(false);
    expect(r.similarity).toBeGreaterThan(SIMILARITY_THRESHOLD);
  });
  it("passes a clean, novel reply", () => {
    const r = runGates("The garlic knots crew says thank you — see you Friday!", {
      rating: 5,
      recentReplies: ["Completely unrelated earlier reply about brake pads."],
    });
    expect(r.ok).toBe(true);
    expect(r.reasons).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement the gates**

`lib/replydesk/gates/contact-info.ts`:

```ts
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
```

`lib/replydesk/gates/similarity.ts`:

```ts
// Trigram Dice coefficient — cheap template detection, no API needed.
export function trigrams(text: string): Set<string> {
  const norm = text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  if (norm.length === 0) return new Set();
  const padded = `  ${norm} `;
  const grams = new Set<string>();
  for (let i = 0; i <= padded.length - 3; i++) grams.add(padded.slice(i, i + 3));
  return grams;
}

export function diceSimilarity(a: string, b: string): number {
  const ta = trigrams(a);
  const tb = trigrams(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const g of ta) if (tb.has(g)) overlap++;
  return (2 * overlap) / (ta.size + tb.size);
}

export function maxSimilarity(candidate: string, corpus: string[]): number {
  return corpus.reduce((m, prev) => Math.max(m, diceSimilarity(candidate, prev)), 0);
}
```

`lib/replydesk/gates/length.ts`:

```ts
// Negative-review replies must be short: apologize once, move it offline.
const MAX_WORDS_NEGATIVE = 45;

export function lengthViolation(reply: string, rating: number): string | null {
  if (rating > 3) return null;
  const words = reply.trim().split(/\s+/).filter(Boolean).length;
  if (words > MAX_WORDS_NEGATIVE) {
    return `reply to a ${rating}-star review is ${words} words (max ${MAX_WORDS_NEGATIVE} words)`;
  }
  return null;
}
```

`lib/replydesk/gates/index.ts`:

```ts
import type { GateReport } from "../types";
import { findContactInfo } from "./contact-info";
import { maxSimilarity } from "./similarity";
import { lengthViolation } from "./length";

export const SIMILARITY_THRESHOLD = 0.6;

export function runGates(
  reply: string,
  ctx: { rating: number; recentReplies: string[] },
): GateReport {
  const reasons: string[] = [];
  let hardFail = false;

  const contact = findContactInfo(reply);
  if (contact) {
    reasons.push(contact);
    hardFail = true;
  }

  const similarity = maxSimilarity(reply, ctx.recentReplies);
  if (similarity > SIMILARITY_THRESHOLD) {
    reasons.push(`too similar to a recent reply (${(similarity * 100).toFixed(0)}%)`);
  }

  const length = lengthViolation(reply, ctx.rating);
  if (length) reasons.push(length);

  return { ok: reasons.length === 0, hardFail, reasons, similarity };
}

export { findContactInfo, maxSimilarity };
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all gates tests PASS. If the phone regex trips on the date fixture, tighten the regex — do not weaken the fixture.

- [ ] **Step 5: Write `lib/replydesk/gates/CLAUDE.md`**

```markdown
# gates — reply quality gates

Pure functions that police generated replies AFTER the model returns. The model
is never trusted to self-certify; these run in code.

INVARIANTS
- contact-info is a HARD fail (hardFail: true) — the UI must never show a
  copy-ready reply that trips it.
- similarity > SIMILARITY_THRESHOLD (0.6) and negative-review length are SOFT
  fails — generation retries (max 2), then flags for the human.
- No I/O, no imports from ai/ or db.ts. Changing a threshold or regex requires
  a DECISIONS.md entry.

TESTS: tests/replydesk/gates.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add lib/replydesk/gates tests/replydesk/gates.test.ts
git commit -m "feat(replydesk): quality gates — contact-info, similarity, length"
```

---

### Task 3: Prompts (colocated, versioned, tested builders)

**Files:**
- Create: `tests/replydesk/prompts.test.ts`
- Create: `lib/replydesk/ai/prompts/reply.ts`
- Create: `lib/replydesk/ai/prompts/kb.ts`
- Create: `lib/replydesk/ai/prompts/voice.ts`
- Create: `lib/replydesk/ai/prompts/CLAUDE.md`

**Interfaces:**
- Consumes: nothing.
- Produces (used by Task 4):
  - `REPLY_SYSTEM_PROMPT: string`
  - `buildReplyUserPrompt(input: { businessName: string; kbMd: string; voiceMd: string; recentReplies: string[]; reviewText: string; reviewer: string | null; rating: number; varyStructure: boolean }): string`
  - `KB_FROM_URL_PROMPT(url: string): string`, `KB_FROM_TEXT_PROMPT(raw: string): string`, `KB_SYSTEM_PROMPT: string`
  - `VOICE_SYSTEM_PROMPT: string`, `buildVoicePrompt(pastReplies: string): string`

- [ ] **Step 1: Write the failing tests**

`tests/replydesk/prompts.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { REPLY_SYSTEM_PROMPT, buildReplyUserPrompt } from "@/lib/replydesk/ai/prompts/reply";

const baseInput = {
  businessName: "Tony's Pizza",
  kbMd: "## Services\nWood-fired pizza, garlic knots",
  voiceMd: "Warm, first-person, signs off with -Tony",
  recentReplies: ["Earlier reply one.", "Earlier reply two."],
  reviewText: "The garlic knots were incredible!",
  reviewer: "Maria",
  rating: 5,
  varyStructure: false,
};

describe("reply prompts", () => {
  it("system prompt bakes in the non-negotiable rules", () => {
    expect(REPLY_SYSTEM_PROMPT).toMatch(/never include emails/i);
    expect(REPLY_SYSTEM_PROMPT).toMatch(/one specific detail/i);
    expect(REPLY_SYSTEM_PROMPT).toMatch(/40 words/);
  });
  it("user prompt contains KB, voice, review, rating, and recent replies", () => {
    const p = buildReplyUserPrompt(baseInput);
    expect(p).toContain("garlic knots");
    expect(p).toContain("-Tony");
    expect(p).toContain("Maria");
    expect(p).toContain("5 stars");
    expect(p).toContain("Earlier reply two.");
  });
  it("adds the vary-structure instruction only on retries", () => {
    expect(buildReplyUserPrompt(baseInput)).not.toMatch(/completely different structure/i);
    expect(buildReplyUserPrompt({ ...baseInput, varyStructure: true }))
      .toMatch(/completely different structure/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `prompts/reply` not found.

- [ ] **Step 3: Write the prompt modules**

`lib/replydesk/ai/prompts/reply.ts`:

```ts
/**
 * PROMPT: Google-review reply generation.
 * Inputs: knowledgebase md, voice profile md, recent replies, the review.
 * Output contract: JSON { reply, detail_referenced } (enforced via
 * output_config json_schema in ai/generate-reply.ts).
 * Rules mirror docs/replydesk/SPEC.md — change both together.
 */
export const REPLY_SYSTEM_PROMPT = `You write replies to Google reviews on behalf of a local business owner.

NON-NEGOTIABLE RULES:
1. NEVER include emails, phone numbers, URLs, or phrases like "contact us at" in the reply. No exceptions, even if the voice profile or knowledgebase contains them.
2. Reference exactly ONE specific detail from the customer's review (a dish, a staff member, a situation they described). Put that detail in the detail_referenced field.
3. Do not reuse the sentence structure, opener, or sign-off pattern of the recent replies you are shown. Every reply must read as freshly written.
4. For reviews rated 3 stars or lower: maximum 40 words. Apologize once without being defensive, and invite them back in person to make it right — WITHOUT posting any contact info (e.g. "ask for Tony next time you're in").
5. Write in the owner's voice per the voice profile. Never corporate, never AI-flavored. No emojis unless the voice profile uses them.
6. Never open with "Thank you for your review" or "Thank you for your feedback".
7. Length for positive reviews: 1–3 sentences. Warm, specific, human.

Return JSON matching the schema you are given.`;

export function buildReplyUserPrompt(input: {
  businessName: string;
  kbMd: string;
  voiceMd: string;
  recentReplies: string[];
  reviewText: string;
  reviewer: string | null;
  rating: number;
  varyStructure: boolean;
}): string {
  const recent = input.recentReplies.length
    ? input.recentReplies.map((r, i) => `${i + 1}. ${r}`).join("\n")
    : "(none yet)";
  return [
    `BUSINESS: ${input.businessName}`,
    ``,
    `KNOWLEDGEBASE:\n${input.kbMd || "(empty)"}`,
    ``,
    `VOICE PROFILE:\n${input.voiceMd || "(none — default to warm, plainspoken owner voice)"}`,
    ``,
    `RECENT REPLIES (do NOT echo their structure):\n${recent}`,
    ``,
    `REVIEW (${input.rating} stars${input.reviewer ? `, by ${input.reviewer}` : ""}):\n${input.reviewText}`,
    ``,
    input.varyStructure
      ? `IMPORTANT: your previous attempt was too similar to a recent reply. Use a completely different structure: different opener, different length, different sign-off.`
      : ``,
    `Write the reply now.`,
  ].join("\n");
}
```

`lib/replydesk/ai/prompts/kb.ts`:

```ts
/**
 * PROMPT: knowledgebase distillation.
 * Two modes: from a website URL (model uses the web_fetch tool) or from pasted text.
 * Output contract: plain markdown (no JSON) with the section headings below.
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

export function KB_FROM_URL_PROMPT(url: string): string {
  return `Build the knowledgebase for the business at this website: ${url}

Use the web_fetch tool to read the homepage first. If you find links to About, Menu, Services, or Contact pages on the same site, fetch up to 4 of those too. Then write the knowledgebase markdown.`;
}

export function KB_FROM_TEXT_PROMPT(raw: string): string {
  return `Build the knowledgebase from this information the business owner provided:\n\n${raw}\n\nWrite the knowledgebase markdown now.`;
}
```

`lib/replydesk/ai/prompts/voice.ts`:

```ts
/**
 * PROMPT: voice-profile extraction from a business's past review replies.
 * Output contract: plain markdown, sections below.
 */
export const VOICE_SYSTEM_PROMPT = `You analyze how a business owner writes replies to Google reviews, producing a voice profile another writer can imitate.

Produce MARKDOWN with exactly these sections:
## Tone
## Typical length
## Openers they use
## Sign-off
## Recurring phrases
## Do / Don't

Base everything ONLY on the replies provided. If they use emojis, say which. Note anything distinctive (nicknames for customers, local references, humor).`;

export function buildVoicePrompt(pastReplies: string): string {
  return `Here are past review replies written by the business owner:\n\n${pastReplies}\n\nWrite the voice profile markdown now.`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Write `lib/replydesk/ai/prompts/CLAUDE.md`**

```markdown
# ai/prompts — versioned prompt modules

Every LLM prompt in ReplyDesk lives here as an exported constant/builder, one
file per concern, with a header comment stating inputs and output contract.

INVARIANTS
- Prompt text changes are code changes: tested (tests/replydesk/prompts.test.ts),
  reviewed, and logged in docs/replydesk/DECISIONS.md when behavior-relevant.
- reply.ts rules must stay in sync with docs/replydesk/SPEC.md and with the
  code gates in ../gates/ (the gates are the enforcement; the prompt is the
  first line of defense).
- Builders are pure string functions — no I/O.
```

- [ ] **Step 6: Commit**

```bash
git add lib/replydesk/ai/prompts tests/replydesk/prompts.test.ts
git commit -m "feat(replydesk): reply/kb/voice prompts with tested builders"
```

---

### Task 4: AI callers — generate-reply with gate/retry loop, KB builder, voice extractor

**Files:**
- Create: `tests/replydesk/generate-reply.test.ts`
- Create: `lib/replydesk/ai/client.ts`
- Create: `lib/replydesk/ai/generate-reply.ts`
- Create: `lib/replydesk/ai/build-knowledgebase.ts`
- Create: `lib/replydesk/ai/extract-voice.ts`
- Create: `lib/replydesk/ai/CLAUDE.md`

**Interfaces:**
- Consumes: prompts (Task 3), `runGates`/`SIMILARITY_THRESHOLD` (Task 2), `GeneratedReply` (Task 1).
- Produces (used by Task 6–8 server actions):
  - `getAnthropic(): Anthropic` (env-key factory)
  - `generateReply(anthropic: Anthropic, input: { businessName; kbMd; voiceMd; recentReplies; reviewText; reviewer; rating }): Promise<GeneratedReply>`
  - `buildKnowledgebase(anthropic: Anthropic, source: { kind: "url"; url: string } | { kind: "text"; raw: string }): Promise<string>` (markdown)
  - `extractVoice(anthropic: Anthropic, pastReplies: string): Promise<string>` (markdown)

- [ ] **Step 1: Write the failing tests**

`tests/replydesk/generate-reply.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { generateReply } from "@/lib/replydesk/ai/generate-reply";

// Minimal fake of the Anthropic client: returns queued canned JSON replies.
function fakeClient(replies: Array<{ reply: string; detail_referenced: string }>) {
  let call = 0;
  const calls: unknown[] = [];
  const client = {
    messages: {
      create: async (params: unknown) => {
        calls.push(params);
        const body = replies[Math.min(call, replies.length - 1)];
        call++;
        return {
          stop_reason: "end_turn",
          content: [{ type: "text", text: JSON.stringify(body) }],
        };
      },
    },
  } as unknown as Anthropic;
  return { client, calls };
}

const input = {
  businessName: "Tony's Pizza",
  kbMd: "## Specialties\ngarlic knots",
  voiceMd: "warm",
  recentReplies: [] as string[],
  reviewText: "Garlic knots were incredible!",
  reviewer: "Maria",
  rating: 5,
};

describe("generateReply", () => {
  it("returns a passing reply on the first attempt", async () => {
    const { client } = fakeClient([
      { reply: "So glad the garlic knots hit the spot, Maria — see you soon!", detail_referenced: "garlic knots" },
    ]);
    const out = await generateReply(client, input);
    expect(out.gate.ok).toBe(true);
    expect(out.attempts).toBe(1);
    expect(out.detailReferenced).toBe("garlic knots");
  });

  it("retries when the reply is too similar to a recent one, with varyStructure set", async () => {
    const prev = "So glad the garlic knots hit the spot, Maria — see you soon!";
    const { client, calls } = fakeClient([
      { reply: prev, detail_referenced: "garlic knots" }, // attempt 1: near-duplicate
      { reply: "Maria, the kitchen crew is grinning — knots are our pride. Come back Friday!", detail_referenced: "garlic knots" },
    ]);
    const out = await generateReply(client, { ...input, recentReplies: [prev] });
    expect(out.attempts).toBe(2);
    expect(out.gate.ok).toBe(true);
    // second call's user prompt must include the vary-structure instruction
    const second = JSON.stringify(calls[1]);
    expect(second).toMatch(/completely different structure/i);
  });

  it("gives up after 3 attempts and returns the flagged reply", async () => {
    const prev = "So glad the garlic knots hit the spot, Maria — see you soon!";
    const { client } = fakeClient([{ reply: prev, detail_referenced: "garlic knots" }]);
    const out = await generateReply(client, { ...input, recentReplies: [prev] });
    expect(out.attempts).toBe(3);
    expect(out.gate.ok).toBe(false);
    expect(out.gate.hardFail).toBe(false);
  });

  it("hard-fails without retrying burn when contact info persists", async () => {
    const { client } = fakeClient([
      { reply: "Email tony@pizza.com and we'll fix it", detail_referenced: "issue" },
    ]);
    const out = await generateReply(client, input);
    expect(out.gate.hardFail).toBe(true);
    expect(out.gate.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `ai/generate-reply` not found.

- [ ] **Step 3: Implement the AI callers**

`lib/replydesk/ai/client.ts`:

```ts
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-4-8";

export function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  return new Anthropic(); // reads ANTHROPIC_API_KEY from env
}

/** Concatenate all text blocks of a response. */
export function textOf(response: { content: Array<{ type: string; text?: string }> }): string {
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
}
```

`lib/replydesk/ai/generate-reply.ts`:

```ts
import type Anthropic from "@anthropic-ai/sdk";
import { MODEL, textOf } from "./client";
import { REPLY_SYSTEM_PROMPT, buildReplyUserPrompt } from "./prompts/reply";
import { runGates } from "../gates";
import type { GeneratedReply } from "../types";

const REPLY_SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    detail_referenced: { type: "string" },
  },
  required: ["reply", "detail_referenced"],
  additionalProperties: false,
} as const;

const MAX_ATTEMPTS = 3;

export async function generateReply(
  anthropic: Anthropic,
  input: {
    businessName: string;
    kbMd: string;
    voiceMd: string;
    recentReplies: string[];
    reviewText: string;
    reviewer: string | null;
    rating: number;
  },
): Promise<GeneratedReply> {
  let last: GeneratedReply | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system: REPLY_SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: REPLY_SCHEMA } },
      messages: [
        {
          role: "user",
          content: buildReplyUserPrompt({ ...input, varyStructure: attempt > 1 }),
        },
      ],
    });

    const parsed = JSON.parse(textOf(response)) as {
      reply: string;
      detail_referenced: string;
    };
    const gate = runGates(parsed.reply, {
      rating: input.rating,
      recentReplies: input.recentReplies,
    });
    last = {
      reply: parsed.reply,
      detailReferenced: parsed.detail_referenced,
      gate,
      attempts: attempt,
    };
    if (gate.ok) return last;
    // Retry on any failure (retrying can also clear contact-info misses);
    // after MAX_ATTEMPTS we return the flagged result for human review.
  }

  return last!;
}
```

`lib/replydesk/ai/build-knowledgebase.ts`:

```ts
import type Anthropic from "@anthropic-ai/sdk";
import { MODEL, textOf } from "./client";
import { KB_SYSTEM_PROMPT, KB_FROM_URL_PROMPT, KB_FROM_TEXT_PROMPT } from "./prompts/kb";

export type KbSource = { kind: "url"; url: string } | { kind: "text"; raw: string };

export async function buildKnowledgebase(
  anthropic: Anthropic,
  source: KbSource,
): Promise<string> {
  const userPrompt =
    source.kind === "url" ? KB_FROM_URL_PROMPT(source.url) : KB_FROM_TEXT_PROMPT(source.raw);

  const params = {
    model: MODEL,
    max_tokens: 4000,
    system: KB_SYSTEM_PROMPT,
    messages: [{ role: "user" as const, content: userPrompt }],
    // web_fetch only fetches URLs already present in the conversation —
    // the URL is in the user prompt, so the homepage fetch is allowed, and
    // same-site links found in fetched pages become fetchable in turn.
    ...(source.kind === "url"
      ? { tools: [{ type: "web_fetch_20260209" as const, name: "web_fetch" as const, max_uses: 5 }] }
      : {}),
  };

  let response = await anthropic.messages.create(params);
  // Server-side tools can pause the turn; resume by echoing the assistant turn.
  let continuations = 0;
  while (response.stop_reason === "pause_turn" && continuations < 5) {
    response = await anthropic.messages.create({
      ...params,
      messages: [
        { role: "user" as const, content: userPrompt },
        { role: "assistant" as const, content: response.content },
      ],
    });
    continuations++;
  }

  const md = textOf(response).trim();
  if (!md) throw new Error("Knowledgebase generation returned no text");
  return md;
}
```

`lib/replydesk/ai/extract-voice.ts`:

```ts
import type Anthropic from "@anthropic-ai/sdk";
import { MODEL, textOf } from "./client";
import { VOICE_SYSTEM_PROMPT, buildVoicePrompt } from "./prompts/voice";

export async function extractVoice(
  anthropic: Anthropic,
  pastReplies: string,
): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: VOICE_SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildVoicePrompt(pastReplies) }],
  });
  const md = textOf(response).trim();
  if (!md) throw new Error("Voice extraction returned no text");
  return md;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all PASS (gates + prompts + generate-reply).

- [ ] **Step 5: Write `lib/replydesk/ai/CLAUDE.md`**

```markdown
# ai — Anthropic callers

Wraps every Claude API call in ReplyDesk. Prompts live in ./prompts (see its
CLAUDE.md); this folder owns request shape, parsing, and the gate/retry loop.

INVARIANTS
- Model: claude-opus-4-8 (constant MODEL in client.ts). Never send temperature/
  top_p/top_k/budget_tokens — they 400 on this model family.
- Reply generation uses output_config json_schema; parse the text block with
  JSON.parse. generateReply retries up to 3 total attempts when gates fail,
  setting varyStructure on retries, then returns the flagged result.
- KB-from-URL uses the web_fetch_20260209 server tool (max_uses 5) and handles
  stop_reason "pause_turn" by echoing the assistant turn (max 5 continuations).
- The Anthropic client is always INJECTED (first parameter) so tests use fakes.
  getAnthropic() is only called from server actions.

TESTS: tests/replydesk/generate-reply.test.ts (fake client, no network)
```

- [ ] **Step 6: Commit**

```bash
git add lib/replydesk/ai tests/replydesk/generate-reply.test.ts
git commit -m "feat(replydesk): AI callers — reply generation with gate/retry, KB builder, voice extractor"
```

---

### Task 5: Passcode auth (helpers + login page + guard layout)

**Files:**
- Create: `tests/replydesk/auth.test.ts`
- Create: `lib/replydesk/auth.ts`
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/layout.tsx`
- Create: `app/admin/CLAUDE.md`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces (used by Tasks 6–8):
  - `hashPasscode(p: string): string` (sha256 hex)
  - `isValidSession(cookieValue: string | undefined): boolean` (compares against hash of `process.env.REPLYDESK_PASSCODE`, timing-safe)
  - Cookie name constant: `SESSION_COOKIE = "rd_session"`
  - `app/admin/layout.tsx` redirects unauthenticated visitors to `/admin/login`; all admin pages assume auth.

- [ ] **Step 1: Write the failing test**

`tests/replydesk/auth.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { hashPasscode, isValidSession } from "@/lib/replydesk/auth";

describe("auth", () => {
  beforeEach(() => {
    process.env.REPLYDESK_PASSCODE = "correct horse battery staple";
  });
  it("hash is deterministic and hex", () => {
    expect(hashPasscode("abc")).toBe(hashPasscode("abc"));
    expect(hashPasscode("abc")).toMatch(/^[0-9a-f]{64}$/);
  });
  it("accepts the cookie holding the hash of the real passcode", () => {
    expect(isValidSession(hashPasscode("correct horse battery staple"))).toBe(true);
  });
  it("rejects wrong or missing cookies", () => {
    expect(isValidSession(hashPasscode("wrong"))).toBe(false);
    expect(isValidSession(undefined)).toBe(false);
    expect(isValidSession("")).toBe(false);
  });
  it("rejects everything when the env passcode is unset", () => {
    delete process.env.REPLYDESK_PASSCODE;
    expect(isValidSession(hashPasscode("anything"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `auth` not found.

- [ ] **Step 3: Implement `lib/replydesk/auth.ts`**

```ts
import { createHash, timingSafeEqual } from "crypto";

export const SESSION_COOKIE = "rd_session";

export function hashPasscode(p: string): string {
  return createHash("sha256").update(p).digest("hex");
}

export function isValidSession(cookieValue: string | undefined): boolean {
  const pass = process.env.REPLYDESK_PASSCODE;
  if (!pass || !cookieValue) return false;
  const expected = Buffer.from(hashPasscode(pass));
  const got = Buffer.from(cookieValue);
  return got.length === expected.length && timingSafeEqual(got, expected);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test` — Expected: PASS.

- [ ] **Step 5: Login page with inline server action**

Before writing, skim `node_modules/next/dist/docs/` for server actions + `cookies()` (async in this version) to confirm signatures.

`app/admin/login/page.tsx`:

```tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashPasscode, isValidSession, SESSION_COOKIE } from "@/lib/replydesk/auth";

async function login(formData: FormData) {
  "use server";
  const passcode = String(formData.get("passcode") ?? "");
  const candidate = hashPasscode(passcode);
  if (!isValidSession(candidate)) redirect("/admin/login?error=1");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, candidate, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/admin",
  });
  redirect("/admin");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form action={login} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="font-heading text-2xl font-bold text-slate-900">ReplyDesk</h1>
        <p className="mt-1 text-sm text-slate-500">FiveStar Local internal console</p>
        {error && <p className="mt-4 text-sm text-gred">Wrong passcode.</p>}
        <input
          type="password"
          name="passcode"
          autoFocus
          placeholder="Passcode"
          className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue"
        />
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90"
        >
          Enter
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 6: Guard layout**

`app/admin/layout.tsx`:

```tsx
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isValidSession, SESSION_COOKIE } from "@/lib/replydesk/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const authed = isValidSession(jar.get(SESSION_COOKIE)?.value);
  // The login page lives under this layout; let it render unauthenticated.
  const hdrs = await headers();
  const path = hdrs.get("x-invoke-path") ?? "";
  if (!authed && !path.includes("/admin/login")) redirect("/admin/login");

  if (!authed) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/admin" className="font-heading font-bold text-slate-900">
            ReplyDesk
          </Link>
          <span className="font-mono text-xs uppercase tracking-widest text-slate-400">
            internal
          </span>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
```

**Framework check (required):** the `x-invoke-path` header may not exist in this Next version. If it doesn't, restructure instead: move the guard out of the shared layout — create route group `app/admin/(protected)/layout.tsx` containing the guard + nav, put `page.tsx` and `businesses/` inside `(protected)/`, and leave `login/` outside it under a plain `app/admin/login/page.tsx`. Verify whichever approach against `node_modules/next/dist/docs/` and record the choice in `docs/replydesk/DECISIONS.md`.

- [ ] **Step 7: Write `app/admin/CLAUDE.md`**

```markdown
# app/admin — ReplyDesk web shell

Thin Next.js shell over lib/replydesk. UI + server actions only; no business
logic lives here.

INVARIANTS
- Every page under /admin (except login) assumes the layout guard ran:
  a valid rd_session cookie (sha256 of REPLYDESK_PASSCODE).
- Server actions in actions.ts: construct real clients (getDb, getAnthropic),
  call lib/replydesk functions, revalidatePath. They contain NO logic.
- Secrets are read only inside server code. Nothing here is public marketing
  UI — but keep the same Tailwind design language as the site.

MAP
- layout.tsx — auth guard + nav
- login/ — passcode form (sets cookie)
- page.tsx — business list + create
- businesses/[id]/ — KB builder + reply workspace (client components in
  components/admin/)
```

- [ ] **Step 8: Verify build + manual check**

Run: `npm run build`
Expected: compiles; `/admin` routes listed.

Run `npm run dev`, visit `http://localhost:3000/admin` → redirected to `/admin/login`; wrong passcode → error; correct passcode (set `REPLYDESK_PASSCODE` in `.env.local` first) → lands on `/admin` (empty page arrives in Task 6 — a 404 here is expected until then; verify the cookie is set instead).

- [ ] **Step 9: Commit**

```bash
git add lib/replydesk/auth.ts tests/replydesk/auth.test.ts app/admin
git commit -m "feat(replydesk): passcode auth, login page, guarded admin layout"
```

---

### Task 6: Server actions + business list page

**Files:**
- Create: `app/admin/actions.ts`
- Create: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `getDb` + queries (Task 1), `getAnthropic`/`generateReply`/`buildKnowledgebase`/`extractVoice` (Task 4).
- Produces (used by Task 7–8 components): server actions
  - `createBusinessAction(formData: FormData): Promise<void>` (redirects to the new business page)
  - `saveKbAction(businessId: string, kbMd: string): Promise<void>`
  - `saveVoiceAction(businessId: string, voiceMd: string): Promise<void>`
  - `buildKbFromUrlAction(businessId: string, url: string): Promise<string>` (returns md, does NOT save — UI shows for review)
  - `buildKbFromTextAction(businessId: string, raw: string): Promise<string>`
  - `extractVoiceAction(businessId: string, pastReplies: string): Promise<string>`
  - `generateReplyAction(input: { businessId: string; rating: number; reviewer: string; reviewText: string }): Promise<{ reviewId: string; reply: string; detailReferenced: string; ok: boolean; hardFail: boolean; reasons: string[]; attempts: number }>`
  - `markPostedAction(reviewId: string, businessId: string): Promise<void>`

- [ ] **Step 1: Write `app/admin/actions.ts`**

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, createBusiness, getBusiness, updateBusiness, insertReview, markPosted, recentPostedReplies } from "@/lib/replydesk/db";
import { getAnthropic } from "@/lib/replydesk/ai/client";
import { generateReply } from "@/lib/replydesk/ai/generate-reply";
import { buildKnowledgebase } from "@/lib/replydesk/ai/build-knowledgebase";
import { extractVoice } from "@/lib/replydesk/ai/extract-voice";

export async function createBusinessAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const reviewUrl = String(formData.get("reviewUrl") ?? "").trim() || null;
  const b = await createBusiness(getDb(), { name, reviewUrl });
  redirect(`/admin/businesses/${b.id}`);
}

export async function saveKbAction(businessId: string, kbMd: string): Promise<void> {
  await updateBusiness(getDb(), businessId, { kbMd });
  revalidatePath(`/admin/businesses/${businessId}`);
}

export async function saveVoiceAction(businessId: string, voiceMd: string): Promise<void> {
  await updateBusiness(getDb(), businessId, { voiceMd });
  revalidatePath(`/admin/businesses/${businessId}`);
}

export async function buildKbFromUrlAction(_businessId: string, url: string): Promise<string> {
  if (!/^https?:\/\//.test(url)) throw new Error("URL must start with http(s)://");
  return buildKnowledgebase(getAnthropic(), { kind: "url", url });
}

export async function buildKbFromTextAction(_businessId: string, raw: string): Promise<string> {
  return buildKnowledgebase(getAnthropic(), { kind: "text", raw });
}

export async function extractVoiceAction(_businessId: string, pastReplies: string): Promise<string> {
  return extractVoice(getAnthropic(), pastReplies);
}

export async function generateReplyAction(input: {
  businessId: string;
  rating: number;
  reviewer: string;
  reviewText: string;
}): Promise<{
  reviewId: string; reply: string; detailReferenced: string;
  ok: boolean; hardFail: boolean; reasons: string[]; attempts: number;
}> {
  const db = getDb();
  const business = await getBusiness(db, input.businessId);
  const recent = await recentPostedReplies(db, input.businessId, 10);
  const out = await generateReply(getAnthropic(), {
    businessName: business.name,
    kbMd: business.kbMd,
    voiceMd: business.voiceMd,
    recentReplies: recent,
    reviewText: input.reviewText,
    reviewer: input.reviewer || null,
    rating: input.rating,
  });
  const saved = await insertReview(db, {
    businessId: input.businessId,
    rating: input.rating,
    reviewer: input.reviewer || null,
    reviewText: input.reviewText,
    replyText: out.reply,
    detailReferenced: out.detailReferenced,
    similarity: out.gate.similarity,
    flags: out.gate.reasons,
  });
  revalidatePath(`/admin/businesses/${input.businessId}`);
  return {
    reviewId: saved.id,
    reply: out.reply,
    detailReferenced: out.detailReferenced,
    ok: out.gate.ok,
    hardFail: out.gate.hardFail,
    reasons: out.gate.reasons,
    attempts: out.attempts,
  };
}

export async function markPostedAction(reviewId: string, businessId: string): Promise<void> {
  await markPosted(getDb(), reviewId);
  revalidatePath(`/admin/businesses/${businessId}`);
}
```

- [ ] **Step 2: Write `app/admin/page.tsx` (business list + create)**

```tsx
import Link from "next/link";
import { getDb, listBusinesses } from "@/lib/replydesk/db";
import { createBusinessAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const businesses = await listBusinesses(getDb());
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-slate-900">Businesses</h1>

      <form action={createBusinessAction} className="mt-6 flex flex-wrap gap-3">
        <input name="name" required placeholder="Business name"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
        <input name="reviewUrl" placeholder="Google review link (optional)"
          className="w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
        <button type="submit"
          className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90">
          Add business
        </button>
      </form>

      <ul className="mt-8 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
        {businesses.length === 0 && (
          <li className="px-5 py-6 text-sm text-slate-500">
            No businesses yet — add your first customer above.
          </li>
        )}
        {businesses.map((b) => (
          <li key={b.id}>
            <Link href={`/admin/businesses/${b.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
              <span className="font-medium text-slate-900">{b.name}</span>
              <span className="text-xs text-slate-400">
                {b.kbMd ? "KB ready" : "KB missing"} · {b.voiceMd ? "voice ready" : "voice missing"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build` — Expected: compiles. (Runtime needs Supabase env vars; if `.env.local` is populated, `npm run dev` → `/admin` shows the empty list and the create form works end-to-end.)

- [ ] **Step 4: Commit**

```bash
git add app/admin/actions.ts app/admin/page.tsx
git commit -m "feat(replydesk): server actions and business list page"
```

---

### Task 7: KB builder component + business detail page

**Files:**
- Create: `components/admin/kb-builder.tsx`
- Create: `components/admin/CLAUDE.md`
- Create: `app/admin/businesses/[id]/page.tsx`

**Interfaces:**
- Consumes: actions from Task 6; `Business`/`Review` types (Task 1); `ReplyWorkspace` placeholder (real one in Task 8).
- Produces: `KbBuilder({ business })` client component; the detail page shell Task 8 plugs into.

- [ ] **Step 1: Write `components/admin/kb-builder.tsx`**

```tsx
"use client";

import { useState, useTransition } from "react";
import type { Business } from "@/lib/replydesk/types";
import {
  buildKbFromUrlAction, buildKbFromTextAction, extractVoiceAction,
  saveKbAction, saveVoiceAction,
} from "@/app/admin/actions";

type Tab = "url" | "paste" | "voice";

export function KbBuilder({ business }: { business: Business }) {
  const [tab, setTab] = useState<Tab>("url");
  const [url, setUrl] = useState("");
  const [raw, setRaw] = useState("");
  const [pastReplies, setPastReplies] = useState("");
  const [kb, setKb] = useState(business.kbMd);
  const [voice, setVoice] = useState(business.voiceMd);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<void>) =>
    start(async () => {
      setStatus(null);
      try { await fn(); }
      catch (e) { setStatus(e instanceof Error ? e.message : "Something went wrong — try again."); }
    });

  const tabClass = (t: Tab) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t ? "bg-gblue text-white" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-heading text-lg font-bold text-slate-900">Knowledgebase</h2>

      <div className="mt-4 flex gap-2">
        <button className={tabClass("url")} onClick={() => setTab("url")}>From website</button>
        <button className={tabClass("paste")} onClick={() => setTab("paste")}>From pasted info</button>
        <button className={tabClass("voice")} onClick={() => setTab("voice")}>Voice from past replies</button>
      </div>

      {tab === "url" && (
        <div className="mt-4 flex gap-2">
          <input value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://their-website.com"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
          <button disabled={pending || !url}
            onClick={() => run(async () => setKb(await buildKbFromUrlAction(business.id, url)))}
            className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50">
            {pending ? "Reading site…" : "Build KB"}
          </button>
        </div>
      )}

      {tab === "paste" && (
        <div className="mt-4 space-y-2">
          <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={5}
            placeholder="Paste anything the owner told you: services, hours, staff names, specialties…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
          <button disabled={pending || !raw}
            onClick={() => run(async () => setKb(await buildKbFromTextAction(business.id, raw)))}
            className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50">
            {pending ? "Distilling…" : "Build KB"}
          </button>
        </div>
      )}

      {tab === "voice" && (
        <div className="mt-4 space-y-2">
          <textarea value={pastReplies} onChange={(e) => setPastReplies(e.target.value)} rows={5}
            placeholder="Paste their past review replies, one per line…"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
          <button disabled={pending || !pastReplies}
            onClick={() => run(async () => setVoice(await extractVoiceAction(business.id, pastReplies)))}
            className="rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50">
            {pending ? "Analyzing voice…" : "Extract voice profile"}
          </button>
        </div>
      )}

      {status && <p className="mt-3 text-sm text-gred">{status}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Knowledgebase (editable)</h3>
            <button disabled={pending}
              onClick={() => run(async () => { await saveKbAction(business.id, kb); setStatus("KB saved."); })}
              className="text-sm font-medium text-gblue hover:underline disabled:opacity-50">
              Save KB
            </button>
          </div>
          <textarea value={kb} onChange={(e) => setKb(e.target.value)} rows={14}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-gblue" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Voice profile (editable)</h3>
            <button disabled={pending}
              onClick={() => run(async () => { await saveVoiceAction(business.id, voice); setStatus("Voice saved."); })}
              className="text-sm font-medium text-gblue hover:underline disabled:opacity-50">
              Save voice
            </button>
          </div>
          <textarea value={voice} onChange={(e) => setVoice(e.target.value)} rows={14}
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-gblue" />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Write the detail page**

`app/admin/businesses/[id]/page.tsx`:

```tsx
import { getDb, getBusiness, listReviews } from "@/lib/replydesk/db";
import { KbBuilder } from "@/components/admin/kb-builder";
import { ReplyWorkspace } from "@/components/admin/reply-workspace";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // KB builds fetch several pages; default 10s is too tight

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = getDb();
  const business = await getBusiness(db, id);
  const reviews = await listReviews(db, id, 25);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold text-slate-900">{business.name}</h1>
        {business.reviewUrl && (
          <a href={business.reviewUrl} target="_blank" rel="noopener noreferrer"
            className="text-sm text-gblue hover:underline">
            Google review page ↗
          </a>
        )}
      </div>
      <KbBuilder business={business} />
      <ReplyWorkspace business={business} reviews={reviews} />
    </div>
  );
}
```

Note: `ReplyWorkspace` is created in Task 8. To keep this task's build green, create the minimal placeholder now (Task 8 replaces it entirely):

`components/admin/reply-workspace.tsx` (placeholder):

```tsx
"use client";
import type { Business, Review } from "@/lib/replydesk/types";
export function ReplyWorkspace(_props: { business: Business; reviews: Review[] }) {
  return null;
}
```

- [ ] **Step 3: Write `components/admin/CLAUDE.md`**

```markdown
# components/admin — ReplyDesk client components

Interactive pieces of the admin console. They call server actions from
app/admin/actions.ts and hold only view state — no business rules here.

MAP
- kb-builder.tsx — 3-tab KB builder (URL / pasted info / voice from past
  replies) + editable KB & voice textareas with explicit Save.
- reply-workspace.tsx — paste review → generate → gate verdict → copy →
  mark posted. Gate verdicts come from the server; this component only
  renders them (hardFail = red, never copy-ready; soft flags = amber).
```

- [ ] **Step 4: Verify build + manual check**

Run: `npm run build` — Expected: compiles.
Manual (`npm run dev`, with env vars set): create a business → detail page renders → paste-info KB build returns markdown into the textarea → Save KB persists (reload page to confirm).

- [ ] **Step 5: Commit**

```bash
git add components/admin app/admin/businesses
git commit -m "feat(replydesk): KB builder UI and business detail page"
```

---

### Task 8: Reply workspace (generate → gates → copy → posted)

**Files:**
- Modify: `components/admin/reply-workspace.tsx` (replace the placeholder entirely)

**Interfaces:**
- Consumes: `generateReplyAction`, `markPostedAction` (Task 6); `Business`, `Review` (Task 1).
- Produces: the complete daily-driver UI.

- [ ] **Step 1: Implement the full workspace**

`components/admin/reply-workspace.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import type { Business, Review } from "@/lib/replydesk/types";
import { generateReplyAction, markPostedAction } from "@/app/admin/actions";

type Draft = {
  reviewId: string; reply: string; detailReferenced: string;
  ok: boolean; hardFail: boolean; reasons: string[]; attempts: number;
};

export function ReplyWorkspace({ business, reviews }: { business: Business; reviews: Review[] }) {
  const [rating, setRating] = useState(5);
  const [reviewer, setReviewer] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const generate = () =>
    start(async () => {
      setError(null); setDraft(null); setCopied(false);
      try {
        setDraft(await generateReplyAction({ businessId: business.id, rating, reviewer, reviewText }));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Generation failed — the review text is kept, try again.");
      }
    });

  const copyAndMark = (d: Draft) =>
    start(async () => {
      await navigator.clipboard.writeText(d.reply);
      setCopied(true);
      await markPostedAction(d.reviewId, business.id);
    });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="font-heading text-lg font-bold text-slate-900">Reply workspace</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-[6rem_1fr]">
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}
          className="rounded-lg border border-slate-300 px-2 py-2 text-sm">
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
        </select>
        <input value={reviewer} onChange={(e) => setReviewer(e.target.value)}
          placeholder="Reviewer name (optional)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
      </div>
      <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={4}
        placeholder="Paste the Google review text here…"
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-gblue" />
      <button disabled={pending || !reviewText.trim()} onClick={generate}
        className="mt-3 rounded-lg bg-gblue px-4 py-2 text-sm font-medium text-white hover:bg-gblue/90 disabled:opacity-50">
        {pending ? "Writing…" : "Generate reply"}
      </button>

      {error && <p className="mt-3 text-sm text-gred">{error}</p>}

      {draft && (
        <div className={`mt-5 rounded-xl border p-4 ${
          draft.hardFail ? "border-gred/40 bg-gred/5"
          : draft.ok ? "border-ggreen/40 bg-ggreen/5"
          : "border-gyellow/60 bg-gyellow/10"}`}>
          <p className="whitespace-pre-wrap text-sm text-slate-800">{draft.reply}</p>
          <p className="mt-2 text-xs text-slate-500">
            Detail referenced: {draft.detailReferenced} · attempts: {draft.attempts}
          </p>
          {draft.reasons.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs font-medium text-slate-700">
              {draft.reasons.map((r) => <li key={r}>⚠ {r}</li>)}
            </ul>
          )}
          {draft.hardFail ? (
            <p className="mt-3 text-sm font-semibold text-gred">
              Blocked: contains contact info. Regenerate or edit by hand — do not post as-is.
            </p>
          ) : (
            <button disabled={pending} onClick={() => copyAndMark(draft)}
              className="mt-3 rounded-lg bg-ggreen px-4 py-2 text-sm font-medium text-white hover:bg-ggreen/90 disabled:opacity-50">
              {copied ? "Copied — marked posted ✓" : draft.ok ? "Copy reply & mark posted" : "Copy anyway (flagged) & mark posted"}
            </button>
          )}
        </div>
      )}

      <h3 className="mt-8 text-sm font-semibold text-slate-700">Recent reviews</h3>
      <ul className="mt-2 divide-y divide-slate-100">
        {reviews.length === 0 && <li className="py-3 text-sm text-slate-500">Nothing logged yet.</li>}
        {reviews.map((r) => (
          <li key={r.id} className="py-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{"★".repeat(r.rating)}{r.reviewer ? ` · ${r.reviewer}` : ""}</span>
              <span className={r.status === "posted" ? "text-ggreen" : "text-slate-400"}>{r.status}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-slate-700">{r.reviewText}</p>
            {r.replyText && <p className="mt-1 line-clamp-2 text-sm text-slate-500">↳ {r.replyText}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Verify build + full manual E2E**

Run: `npm run build` — Expected: compiles.

Manual E2E (real API key in `.env.local`):
1. `/admin` → create "Tony's Pizza".
2. KB tab "From pasted info" → paste 3 lines about a pizza shop → Build KB → Save KB.
3. Reply workspace: 5★, paste "The garlic knots were incredible and Maria at the counter was so friendly!" → Generate → verdict card green, reply references knots or Maria → Copy & mark posted → review appears in the list as `posted`.
4. Negative path: 1★ "waited 45 minutes, cold pizza" → reply ≤ 40 words, no contact info, apologetic-not-defensive.
5. Repeat step 3 with the same review → similarity retry should kick in (attempts > 1 in the meta line) or flag amber.

- [ ] **Step 3: Commit**

```bash
git add components/admin/reply-workspace.tsx
git commit -m "feat(replydesk): reply workspace — generate, gate verdicts, copy, posted log"
```

---

### Task 9: Final verification, context sync, handoff notes

**Files:**
- Modify: `docs/replydesk/DECISIONS.md` (append any judgment calls made)
- Modify: any `CLAUDE.md` that drifted from reality
- Create: nothing new

- [ ] **Step 1: Full check suite**

```bash
npm test          # expected: all green (gates, prompts, generate-reply, auth)
npm run lint      # expected: clean
npm run build     # expected: compiles, /admin routes present
```

- [ ] **Step 2: Context integrity pass (Interpretable Context Methodology)**

For each of: `lib/replydesk/CLAUDE.md`, `gates/CLAUDE.md`, `ai/CLAUDE.md`, `ai/prompts/CLAUDE.md`, `app/admin/CLAUDE.md`, `components/admin/CLAUDE.md` — re-read the folder and the file together; fix any statement that is no longer true. Append DECISIONS.md entries for every deviation from this plan.

- [ ] **Step 3: Commit and report**

```bash
git add -A
git commit -m "chore(replydesk): final verification and context sync"
```

Final report to the user MUST list the outstanding **human tasks**:
1. Create the Supabase project + run `supabase/migrations/0001_replydesk.sql`; set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` and Vercel.
2. Create an Anthropic API key (console.anthropic.com) and set `ANTHROPIC_API_KEY` in both places; enable billing (expected spend $10–15/mo).
3. Choose `REPLYDESK_PASSCODE` and set it in both places.
4. Submit the Google Business Profile API application per `docs/replydesk/GBP-API.md` and log the date.
5. Run the pizza-shop eval: real reviews from the first customer through the workspace before using it on paying customers.

---

## Self-review (completed at planning time)

- **Spec coverage:** KB builder 3 input methods → Tasks 3/4/7; reply generation + structured output → Tasks 3/4; quality gates + retry → Tasks 2/4; copy/posted log → Task 8; passcode auth → Task 5; multi-tenant data → Task 1; GBP-API parallel track → Task 0 doc; out-of-scope items excluded.
- **Placeholder scan:** the only intentional placeholder is `reply-workspace.tsx` in Task 7, explicitly replaced in Task 8.
- **Type consistency:** `GateReport`/`GeneratedReply` defined once in Task 1 `types.ts`; consumed with identical names in Tasks 2, 4, 6, 8. Action signatures in Task 6 match component call-sites in Tasks 7–8.
