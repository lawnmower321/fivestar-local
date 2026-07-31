# Phase 5: ReplyDesk Cross-Client Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/admin/replydesk` shows recent posted replies across all clients and a "needs attention" list (pending drafts, stale active clients), each row linking into that client's ReplyDesk tab.

**Architecture:** No migration. Two review-domain readers join `businesses(name)` in `lib/replydesk/db.ts` (reviews are ReplyDesk domain); the attention heuristic is a pure function in `lib/crm/attention.ts` fed plain data. One new page + one sidebar entry.

**Tech Stack:** Next.js 16.2.10 (App Router), Supabase (service-role via `lib` DI), vitest, Tailwind + existing shadcn/ui admin kit.

**Spec:** `docs/superpowers/specs/2026-07-31-phases-3-5-design.md` — the "A5 heuristic (exact)" section is normative.
**Depends on:** Phase 2 shipped (client records; true today). Reads are richer after Phases 3–4 but nothing here imports from them.

## Global Constraints

- `lib/**` never imports `next/*`; Supabase client injected (pure/DI).
- No new server actions in this phase (read-only page) — if one appears, it follows requireUser-first + zod.
- `docs/replydesk/DECISIONS.md` is append-only.
- Marketing-site files never appear in these commits — path-scoped `git add` only.
- New page: `export const dynamic = "force-dynamic"`.
- Heuristic thresholds live in `lib/crm/attention.ts` (`STALE_DAYS = 7`), not inline in the page.
- Verify suite: `npm test`, `npm run lint`, `npm run build` — all clean before any completion claim.

---

### Task 1: Attention heuristic (pure)

**Files:**
- Create: `lib/crm/attention.ts`
- Test: `tests/crm/attention.test.ts`

**Interfaces:**
- Produces (consumed by Task 3):
  - `STALE_DAYS = 7`
  - `type ReviewMeta = { businessId: string; status: "draft" | "posted"; createdAt: string; postedAt: string | null }`
  - `type AttentionItem = { businessId: string; businessName: string; reasons: string[] }`
  - `buildAttention(clients: { id: string; name: string }[], reviews: ReviewMeta[], now: Date, staleDays?: number): AttentionItem[]` — callers pass **active** clients only.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect } from "vitest";
import { buildAttention, STALE_DAYS, type ReviewMeta } from "@/lib/crm/attention";

const NOW = new Date("2026-07-31T12:00:00Z");
const joes = { id: "b1", name: "Joe's" };

function meta(partial: Partial<ReviewMeta>): ReviewMeta {
  return { businessId: "b1", status: "posted", createdAt: "2026-07-30T00:00:00Z",
           postedAt: "2026-07-30T00:00:00Z", ...partial };
}

describe("buildAttention", () => {
  it("exposes the 7-day default", () => {
    expect(STALE_DAYS).toBe(7);
  });

  it("flags a client whose latest review row is an unposted draft", () => {
    const reviews = [
      meta({ createdAt: "2026-07-28T00:00:00Z" }),                                   // older posted
      meta({ status: "draft", createdAt: "2026-07-30T00:00:00Z", postedAt: null }),  // latest = draft
    ];
    const out = buildAttention([joes], reviews, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].reasons).toContain("Latest reply draft was never posted");
  });

  it("does not flag drafts that were superseded by a posted reply", () => {
    const reviews = [
      meta({ status: "draft", createdAt: "2026-07-28T00:00:00Z", postedAt: null }),  // audit-trail draft
      meta({ createdAt: "2026-07-30T00:00:00Z" }),                                   // latest = posted
    ];
    expect(buildAttention([joes], reviews, NOW)).toEqual([]);
  });

  it("flags no-reply-ever and stale clients distinctly", () => {
    expect(buildAttention([joes], [], NOW)[0].reasons).toEqual(["No reply ever posted"]);
    const stale = [meta({ createdAt: "2026-07-01T00:00:00Z", postedAt: "2026-07-01T00:00:00Z" })];
    expect(buildAttention([joes], stale, NOW)[0].reasons).toEqual(["No reply posted in 7+ days"]);
  });

  it("a recent posted reply keeps the client off the list", () => {
    const fresh = [meta({ postedAt: "2026-07-29T00:00:00Z" })];
    expect(buildAttention([joes], fresh, NOW)).toEqual([]);
  });

  it("collects multiple reasons on one row", () => {
    const reviews = [
      meta({ createdAt: "2026-07-01T00:00:00Z", postedAt: "2026-07-01T00:00:00Z" }),
      meta({ status: "draft", createdAt: "2026-07-30T00:00:00Z", postedAt: null }),
    ];
    const out = buildAttention([joes], reviews, NOW);
    expect(out).toHaveLength(1);
    expect(out[0].reasons).toEqual([
      "Latest reply draft was never posted",
      "No reply posted in 7+ days",
    ]);
  });

  it("only reads each client's own reviews", () => {
    const other = [meta({ businessId: "b2", status: "draft", postedAt: null })];
    const out = buildAttention([joes], other, NOW);
    expect(out[0].reasons).toEqual(["No reply ever posted"]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/crm/attention.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// "Clients needing attention" heuristic (spec 2026-07-31-phases-3-5-design.md,
// user-approved signals). Pure TS — callers fetch and pass plain data; pass
// ACTIVE clients only. Draft rows accumulate as an audit trail (regenerations
// insert new rows), so the draft signal reads only the LATEST row per client.
export const STALE_DAYS = 7;

export type ReviewMeta = {
  businessId: string;
  status: "draft" | "posted";
  createdAt: string;
  postedAt: string | null;
};

export type AttentionItem = { businessId: string; businessName: string; reasons: string[] };

export function buildAttention(
  clients: { id: string; name: string }[],
  reviews: ReviewMeta[],
  now: Date,
  staleDays: number = STALE_DAYS,
): AttentionItem[] {
  const cutoff = new Date(now.getTime() - staleDays * 86_400_000).toISOString();
  return clients.flatMap((c) => {
    const mine = reviews.filter((r) => r.businessId === c.id);
    const reasons: string[] = [];
    const latest = mine.reduce<ReviewMeta | null>(
      (best, r) => (!best || r.createdAt > best.createdAt ? r : best), null,
    );
    if (latest?.status === "draft") reasons.push("Latest reply draft was never posted");
    const lastPosted = mine.map((r) => r.postedAt).filter((p): p is string => p !== null).sort().at(-1) ?? null;
    if (lastPosted === null) reasons.push("No reply ever posted");
    else if (lastPosted < cutoff) reasons.push(`No reply posted in ${staleDays}+ days`);
    return reasons.length > 0 ? [{ businessId: c.id, businessName: c.name, reasons }] : [];
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/crm/attention.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/crm/attention.ts tests/crm/attention.test.ts
git commit -m "feat(crm): needs-attention heuristic (pending drafts + 7-day staleness)"
```

---

### Task 2: Review-domain readers

**Files:**
- Modify: `lib/replydesk/db.ts` (append)
- Test: `tests/replydesk/db.test.ts` (append)

**Interfaces:**
- Consumes: the file's existing `must`, `rowToReview`, `Review` type; `ReviewMeta` from `lib/crm/attention` (Task 1).
- Produces (consumed by Task 3):
  - `recentPostedAcrossClients(db, limit = 20): Promise<{ review: Review; businessName: string }[]>` (status posted, join `businesses(name)`, posted_at desc)
  - `listReviewMeta(db, businessIds: string[]): Promise<ReviewMeta[]>` (returns `[]` without querying when `businessIds` is empty)

- [ ] **Step 1: Write the failing tests** (append to `tests/replydesk/db.test.ts`; add `"in"`, `"not"`, `"order"`, `"limit"`, `"insert"` to the fakeDb method list if not already present)

```ts
describe("recentPostedAcrossClients", () => {
  it("joins the business name and filters to posted", async () => {
    const rows = [{
      id: "r1", business_id: "b1", rating: 5, reviewer: "Ann", review_text: "great",
      reply_text: "thanks", detail_referenced: null, similarity: 0.1, flags: [],
      status: "posted", created_at: "2026-07-30T00:00:00Z",
      posted_at: "2026-07-30T01:00:00Z", businesses: { name: "Joe's" },
    }];
    const { db, calls } = fakeDb({ data: rows });
    const out = await recentPostedAcrossClients(db);
    expect(out[0].businessName).toBe("Joe's");
    expect(out[0].review.id).toBe("r1");
    expect(calls).toContainEqual({ method: "eq", args: ["status", "posted"] });
    expect(calls).toContainEqual({ method: "order", args: ["posted_at", { ascending: false }] });
    expect(calls).toContainEqual({ method: "limit", args: [20] });
  });
});

describe("listReviewMeta", () => {
  it("returns [] for an empty id list without querying", async () => {
    const { db, calls } = fakeDb({ data: [] });
    expect(await listReviewMeta(db, [])).toEqual([]);
    expect(calls).toHaveLength(0);
  });
  it("maps rows and scopes to the given business ids", async () => {
    const rows = [{ business_id: "b1", status: "draft", created_at: "2026-07-30T00:00:00Z", posted_at: null }];
    const { db, calls } = fakeDb({ data: rows });
    expect(await listReviewMeta(db, ["b1", "b2"])).toEqual([
      { businessId: "b1", status: "draft", createdAt: "2026-07-30T00:00:00Z", postedAt: null },
    ]);
    expect(calls).toContainEqual({ method: "in", args: ["business_id", ["b1", "b2"]] });
  });
});
```

Extend the test file's import from `@/lib/replydesk/db` with the two new names.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/replydesk/db.test.ts`
Expected: new tests FAIL; existing ones PASS.

- [ ] **Step 3: Implement** (append to `lib/replydesk/db.ts`; add `import type { ReviewMeta } from "../crm/attention";` beside the existing `../crm/status` import)

```ts
export async function recentPostedAcrossClients(
  db: SupabaseClient, limit = 20,
): Promise<{ review: Review; businessName: string }[]> {
  const { data, error } = await db.from("reviews").select("*, businesses(name)")
    .eq("status", "posted").order("posted_at", { ascending: false }).limit(limit);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return must(data, error).map((r: any) => ({
    review: rowToReview(r), businessName: r.businesses?.name ?? "",
  }));
}

export async function listReviewMeta(
  db: SupabaseClient, businessIds: string[],
): Promise<ReviewMeta[]> {
  if (businessIds.length === 0) return [];
  const { data, error } = await db.from("reviews")
    .select("business_id, status, created_at, posted_at")
    .in("business_id", businessIds);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return must(data, error).map((r: any) => ({
    businessId: r.business_id, status: r.status,
    createdAt: r.created_at, postedAt: r.posted_at,
  }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/replydesk/db.test.ts`
Expected: PASS (all).

- [ ] **Step 5: Commit**

```bash
git add lib/replydesk/db.ts tests/replydesk/db.test.ts
git commit -m "feat(replydesk): cross-client posted-reply + review-meta readers"
```

---

### Task 3: /admin/replydesk page + sidebar entry

**Files:**
- Create: `app/admin/(protected)/replydesk/page.tsx`
- Modify: `components/admin/admin-sidebar.tsx`

**Interfaces:**
- Consumes: `buildAttention`, `STALE_DAYS` (Task 1); `recentPostedAcrossClients`, `listReviewMeta`, `listBusinesses`, `getDb` (Task 2 / existing); existing `StatusBadge` is NOT needed here (attention rows are active-only by construction).

- [ ] **Step 1: The page**

`app/admin/(protected)/replydesk/page.tsx`:

```tsx
import Link from "next/link";
import { getDb, listBusinesses, recentPostedAcrossClients, listReviewMeta } from "@/lib/replydesk/db";
import { buildAttention } from "@/lib/crm/attention";

export const dynamic = "force-dynamic";

export default async function ReplyDeskDashboard() {
  const db = getDb();
  const businesses = await listBusinesses(db);
  const active = businesses.filter((b) => b.status === "active").map((b) => ({ id: b.id, name: b.name }));
  const [reviewMeta, recent] = await Promise.all([
    listReviewMeta(db, active.map((c) => c.id)),
    recentPostedAcrossClients(db, 20),
  ]);
  const attention = buildAttention(active, reviewMeta, new Date());
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-heading text-2xl font-bold text-slate-900">ReplyDesk</h1>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Needs attention
        </h2>
        {attention.length === 0 ? (
          <p className="text-sm text-slate-500">All active clients are covered — nothing pending.</p>
        ) : (
          <ul className="space-y-2">
            {attention.map((a) => (
              <li key={a.businessId} className="rounded-xl border border-gyellow/60 bg-gyellow/5 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-900">{a.businessName}</p>
                  <Link href={`/admin/clients/${a.businessId}/replydesk`} className="shrink-0 text-sm text-gblue hover:underline">
                    Open ReplyDesk →
                  </Link>
                </div>
                <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
                  {a.reasons.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Recent replies
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">No posted replies yet.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map(({ review, businessName }) => (
              <li key={review.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs text-slate-400">
                  <Link href={`/admin/clients/${review.businessId}/replydesk`} className="font-medium text-slate-600 hover:text-gblue hover:underline">
                    {businessName}
                  </Link>
                  {" · "}{"★".repeat(review.rating)}
                  {review.reviewer && ` · ${review.reviewer}`}
                  {review.postedAt && ` · ${new Date(review.postedAt).toLocaleDateString("en-US", { dateStyle: "medium", timeZone: "America/New_York" })}`}
                </p>
                {review.replyText && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-700">{review.replyText}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Sidebar entry**

In `components/admin/admin-sidebar.tsx`, add `MessagesSquare` to the lucide import and a ReplyDesk `SidebarMenuItem` after Tasks:

```tsx
<SidebarMenuItem>
  <SidebarMenuButton isActive={pathname.startsWith("/admin/replydesk")} render={<Link href="/admin/replydesk" />}>
    <MessagesSquare />
    <span>ReplyDesk</span>
  </SidebarMenuButton>
</SidebarMenuItem>
```

- [ ] **Step 3: Verify + manual check**

Run: `npm test && npm run lint && npm run build`
Expected: clean; build lists `/admin/replydesk`.

Manual: with an active client that has an unposted latest draft, the page lists it with "Latest reply draft was never posted" and the link opens that client's ReplyDesk tab; a lead/paused/churned client never appears; recent replies show newest first with business names.

- [ ] **Step 4: Commit**

```bash
git add "app/admin/(protected)/replydesk/page.tsx" components/admin/admin-sidebar.tsx
git commit -m "feat(crm): /admin/replydesk cross-client dashboard"
```

---

### Task 4: Docs sync + full verification

**Files:**
- Modify: `docs/replydesk/DECISIONS.md` (append), `app/admin/CLAUDE.md`, `components/admin/CLAUDE.md`, `lib/crm/CLAUDE.md`, `lib/replydesk/CLAUDE.md`

- [ ] **Step 1: Append the DECISIONS entry**

```markdown
## 2026-07-31 — Phase 5: ReplyDesk cross-client dashboard
/admin/replydesk = recent posted replies (20, joined business names) +
"needs attention" for ACTIVE clients only: latest review row is an unposted
draft, and/or no posted reply in 7+ days / ever (signals + window
user-approved 2026-07-31). The draft signal reads only the latest row per
client because draft rows are an accumulating audit trail (regenerations).
Heuristic is pure (lib/crm/attention.buildAttention); review readers live in
lib/replydesk/db (reviews are ReplyDesk domain). Read-only page — no new
actions.
```

- [ ] **Step 2: Update the CLAUDE.md MAPs**

- `lib/crm/CLAUDE.md`: add `attention.ts` (STALE_DAYS, ReviewMeta, buildAttention).
- `lib/replydesk/CLAUDE.md`: extend the `db.ts` line with the two cross-client readers.
- `app/admin/CLAUDE.md`: add the `/admin/replydesk` page line.
- `components/admin/CLAUDE.md`: update `admin-sidebar.tsx` line (Dashboard/Clients/Tasks/ReplyDesk).

- [ ] **Step 3: Full verification**

Run: `npm test && npm run lint && npm run build`
Expected: all clean.

- [ ] **Step 4: Commit**

```bash
git add docs/replydesk/DECISIONS.md app/admin/CLAUDE.md components/admin/CLAUDE.md lib/crm/CLAUDE.md lib/replydesk/CLAUDE.md
git commit -m "docs(crm): sync context maps + DECISIONS for phase 5 dashboard"
```
